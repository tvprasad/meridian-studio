import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { meridianApi } from '../meridian';

import queryRefused from '../../__fixtures__/query-refused.json';
import queryOk from '../../__fixtures__/query-ok.json';
import queryOkCalibrated from '../../__fixtures__/query-ok-calibrated.json';
import healthFixture from '../../__fixtures__/health.json';
import ingestFixture from '../../__fixtures__/ingest-success.json';
import snowStatusConfigured from '../../__fixtures__/servicenow-status-configured.json';
import snowStatusUnconfigured from '../../__fixtures__/servicenow-status-unconfigured.json';
import snowIngestFixture from '../../__fixtures__/servicenow-ingest-success.json';
import agentQueryOk from '../../__fixtures__/agent-query-ok.json';
import evalQueriesFixture from '../../__fixtures__/evaluation-queries.json';
import evalMetricsFixture from '../../__fixtures__/evaluation-metrics.json';
import evalUnconfigured from '../../__fixtures__/evaluation-unconfigured.json';
import settingsGetFixture from '../../__fixtures__/settings-get.json';
import settingsPostFixture from '../../__fixtures__/settings-post.json';

// ── MSW server ──────────────────────────────────────────────────────────────

let capturedBody: unknown = null;

const server = setupServer(
  http.post('http://localhost:8000/query', async ({ request }) => {
    capturedBody = await request.json();
    // Default to refused fixture (HTTP 422); individual tests override via server.use()
    return HttpResponse.json(queryRefused, { status: 422 });
  }),
  http.get('http://localhost:8000/health', () => {
    return HttpResponse.json(healthFixture);
  }),
  http.get('http://localhost:8000/ingest/servicenow/status', () => {
    return HttpResponse.json(snowStatusConfigured);
  }),
  http.post('http://localhost:8000/ingest/servicenow', async ({ request }) => {
    capturedBody = await request.json();
    return HttpResponse.json(snowIngestFixture);
  }),
  http.post('http://localhost:8000/agent/query', async ({ request }) => {
    capturedBody = await request.json();
    return HttpResponse.json(agentQueryOk);
  }),
  http.get('http://localhost:8000/evaluation/queries', () => {
    return HttpResponse.json(evalQueriesFixture);
  }),
  http.get('http://localhost:8000/evaluation/metrics', () => {
    return HttpResponse.json(evalMetricsFixture);
  }),
  http.get('http://localhost:8000/settings', () => {
    return HttpResponse.json(settingsGetFixture);
  }),
  http.post('http://localhost:8000/settings', async ({ request }) => {
    capturedBody = await request.json();
    return HttpResponse.json(settingsPostFixture);
  }),
  http.get('http://localhost:8001/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  capturedBody = null;
});
afterAll(() => server.close());

// ── Query API tests ─────────────────────────────────────────────────────────

describe('meridianApi.query', () => {
  it('sends the correct payload to /query', async () => {
    await meridianApi.query('What is Meridian?');

    expect(capturedBody).toEqual({
      question: 'What is Meridian?',
    });
  });

  it('maps a REFUSED response to QueryResponse', async () => {
    const result = await meridianApi.query('What is Meridian?');

    expect(result).toEqual(expect.objectContaining({
      status: 'REFUSED',
      trace_id: '3d41b36c-dd37-40c7-9394-c70b40b28187',
      confidence_score: 0.51432025,
      refusal_reason: 'Retrieval confidence below threshold',
      threshold: 0.6,
    }));
  });

  it('maps an OK response to QueryResponse', async () => {
    server.use(
      http.post('http://localhost:8000/query', async () => {
        return HttpResponse.json(queryOk);
      }),
    );

    const result = await meridianApi.query('What is Meridian?');

    expect(result).toEqual(expect.objectContaining({
      status: 'OK',
      trace_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      confidence_score: 0.87,
      raw_confidence: null,
      answer: 'Meridian is a RAG-powered knowledge engine.',
      threshold: 0.6,
    }));
  });

  it('maps raw_confidence when calibration is enabled', async () => {
    server.use(
      http.post('http://localhost:8000/query', async () => {
        return HttpResponse.json(queryOkCalibrated);
      }),
    );

    const result = await meridianApi.query('What is calibrated scoring?');

    expect(result.confidence_score).toBe(0.85);
    expect(result.raw_confidence).toBe(0.70);
    expect(result.raw_confidence).not.toBe(result.confidence_score);
  });

  it('sends conversation_history when provided', async () => {
    const history = [
      { role: 'user' as const, content: 'What topics are covered?' },
      { role: 'assistant' as const, content: 'Deployments and rollbacks.' },
    ];

    await meridianApi.query('Tell me more about #1', history);

    expect(capturedBody).toEqual({
      question: 'Tell me more about #1',
      conversation_history: history,
    });
  });

  it('omits conversation_history when empty', async () => {
    await meridianApi.query('What is Meridian?', []);

    expect(capturedBody).toEqual({
      question: 'What is Meridian?',
    });
  });
});

// ── Health API tests ────────────────────────────────────────────────────────

describe('meridianApi.health', () => {
  it('returns the health response unchanged', async () => {
    const result = await meridianApi.health();

    expect(result).toEqual({
      status: 'ok',
      document_count: 42,
      llm_provider: 'azure',
      retrieval_provider: 'azure',
      retrieval_threshold: 0.6,
      suggested_questions: [
        'What topics are covered in the knowledge base?',
        'How do I reset my password?',
        "What is our company's policy on using generative AI tools?",
        'How do I get access to Azure OpenAI for my project?',
      ],
    });
  });
});

// ── Ingest API tests ─────────────────────────────────────────────────────────

describe('meridianApi.ingest', () => {
  it('sends FormData to /ingest and returns ingestion result', async () => {
    server.use(
      http.post('http://localhost:8000/ingest', async () => {
        return HttpResponse.json(ingestFixture);
      }),
    );

    const formData = new FormData();
    formData.append('files', new Blob(['hello'], { type: 'text/plain' }), 'test.txt');

    const result = await meridianApi.ingest(formData);

    expect(result).toEqual({
      ingested: 1,
      chunks: 5,
      message: '1 documents ingested (5 chunks)',
    });
  });
});

// ── ServiceNow Status API tests ─────────────────────────────────────────────

describe('meridianApi.serviceNowStatus', () => {
  it('returns configured status with last sync info', async () => {
    const result = await meridianApi.serviceNowStatus();

    expect(result).toEqual(snowStatusConfigured);
    expect(result.configured).toBe(true);
    expect(result.last_sync).not.toBeNull();
    expect(result.last_sync?.ingested).toBe(15);
  });

  it('returns unconfigured status when credentials are missing', async () => {
    server.use(
      http.get('http://localhost:8000/ingest/servicenow/status', () => {
        return HttpResponse.json(snowStatusUnconfigured);
      }),
    );

    const result = await meridianApi.serviceNowStatus();

    expect(result.configured).toBe(false);
    expect(result.last_sync).toBeNull();
    expect(result.history).toEqual([]);
  });
});

// ── ServiceNow Ingest API tests ─────────────────────────────────────────────

describe('meridianApi.ingestServiceNow', () => {
  it('sends filters to /ingest/servicenow and returns ingestion result', async () => {
    const result = await meridianApi.ingestServiceNow({
      kb_name: 'IT Knowledge Base',
      category: 'Networking',
      limit: 50,
    });

    expect(capturedBody).toEqual({
      kb_name: 'IT Knowledge Base',
      category: 'Networking',
      limit: 50,
    });
    expect(result).toEqual({
      ingested: 15,
      chunks: 87,
      message: '15 ServiceNow articles ingested (87 chunks)',
    });
  });

  it('sends empty object when no filters are provided', async () => {
    await meridianApi.ingestServiceNow({});

    expect(capturedBody).toEqual({});
  });

  it('throws ApiError with 502 when ServiceNow is unreachable', async () => {
    server.use(
      http.post('http://localhost:8000/ingest/servicenow', () => {
        return HttpResponse.json(
          { detail: 'Failed to connect to ServiceNow instance' },
          { status: 502 },
        );
      }),
    );

    await expect(
      meridianApi.ingestServiceNow({ kb_name: 'IT KB' }),
    ).rejects.toThrow('Failed to connect to ServiceNow instance');
  });

  it('throws ApiError with 400 when credentials are missing', async () => {
    server.use(
      http.post('http://localhost:8000/ingest/servicenow', () => {
        return HttpResponse.json(
          { detail: 'ServiceNow credentials required.' },
          { status: 400 },
        );
      }),
    );

    await expect(
      meridianApi.ingestServiceNow({}),
    ).rejects.toThrow('ServiceNow credentials required.');
  });
});

// ── Agent Query API tests ──────────────────────────────────────────────────

describe('meridianApi.agentQuery', () => {
  it('sends the question to /agent/query and returns the response', async () => {
    const result = await meridianApi.agentQuery('Why are login requests failing for region us-east?');

    expect(capturedBody).toEqual({
      question: 'Why are login requests failing for region us-east?',
    });
    expect(result).toEqual(agentQueryOk);
  });

  it('maps response fields correctly', async () => {
    const result = await meridianApi.agentQuery('test');

    expect(result.status).toBe('OK');
    expect(result.trace_id).toBe('agt-7f3a2e01-b9c4-4d8f-a1e2-c3d4e5f6a7b8');
    expect(result.steps_taken).toBe(3);
    expect(result.elapsed_ms).toBe(27000);
    expect(result.steps).toHaveLength(3);
    expect(result.steps[0]).toEqual(expect.objectContaining({
      step: 1,
      tool: 'search_incidents',
      elapsed_ms: 460,
    }));
  });

  it('throws ApiError on 500 server error', async () => {
    server.use(
      http.post('http://localhost:8000/agent/query', () => {
        return HttpResponse.json(
          { detail: 'Agent execution failed: tool timeout' },
          { status: 500 },
        );
      }),
    );

    await expect(
      meridianApi.agentQuery('test'),
    ).rejects.toThrow('Agent execution failed: tool timeout');
  });
});

// ── Evaluation Queries API tests ────────────────────────────────────────────

describe('meridianApi.evaluationQueries', () => {
  it('returns paginated query log entries', async () => {
    const result = await meridianApi.evaluationQueries();

    expect(result.configured).toBe(true);
    expect(result.total).toBe(3);
    expect(result.queries).toHaveLength(3);
  });

  it('maps query entry fields correctly', async () => {
    const result = await meridianApi.evaluationQueries();
    const first = result.queries![0];

    expect(first).toEqual(expect.objectContaining({
      id: 'q-001',
      trace_id: 'eval-aaa-1111',
      status: 'OK',
      confidence: 0.82,
      raw_confidence: 0.71,
      source: 'query',
    }));
  });

  it('includes raw_confidence for calibrated entries', async () => {
    const result = await meridianApi.evaluationQueries();
    const calibrated = result.queries!.find((q) => q.id === 'q-001')!;

    expect(calibrated.raw_confidence).toBe(0.71);
    expect(calibrated.confidence).toBe(0.82);
    expect(calibrated.raw_confidence).not.toBe(calibrated.confidence);
  });

  it('returns unconfigured when database is not set up', async () => {
    server.use(
      http.get('http://localhost:8000/evaluation/queries', () => {
        return HttpResponse.json(evalUnconfigured);
      }),
    );

    const result = await meridianApi.evaluationQueries();

    expect(result.configured).toBe(false);
    expect(result.error).toBe('Database not configured');
  });
});

// ── Evaluation Metrics API tests ────────────────────────────────────────────

describe('meridianApi.evaluationMetrics', () => {
  it('returns aggregate metrics', async () => {
    const result = await meridianApi.evaluationMetrics();

    expect(result.configured).toBe(true);
    expect(result.total_queries).toBe(127);
    expect(result.avg_confidence).toBe(0.7234);
    expect(result.refusal_rate).toBe(0.1575);
  });

  it('includes latency percentiles', async () => {
    const result = await meridianApi.evaluationMetrics();

    expect(result.latency_p50_ms).toBe(980);
    expect(result.latency_p95_ms).toBe(2450);
  });

  it('includes status and source breakdowns', async () => {
    const result = await meridianApi.evaluationMetrics();

    expect(result.queries_by_status).toEqual({ OK: 107, REFUSED: 20 });
    expect(result.queries_by_source).toEqual({ query: 98, agent: 29 });
  });

  it('returns unconfigured when database is not set up', async () => {
    server.use(
      http.get('http://localhost:8000/evaluation/metrics', () => {
        return HttpResponse.json(evalUnconfigured);
      }),
    );

    const result = await meridianApi.evaluationMetrics();

    expect(result.configured).toBe(false);
  });
});

// ── Settings API tests ────────────────────────────────────────────────────

describe('meridianApi.getSettings', () => {
  it('returns current runtime configuration', async () => {
    const result = await meridianApi.getSettings();

    expect(result).toEqual({
      llm_provider: 'azure',
      retrieval_provider: 'azure',
      retrieval_threshold: 0.6,
      temperature: 0.7,
    });
  });

  it('maps all settings fields including temperature', async () => {
    const result = await meridianApi.getSettings();

    expect(result).toHaveProperty('llm_provider');
    expect(result).toHaveProperty('retrieval_provider');
    expect(result).toHaveProperty('retrieval_threshold');
    expect(result).toHaveProperty('temperature');
    expect(typeof result.retrieval_threshold).toBe('number');
    expect(typeof result.temperature).toBe('number');
  });
});

// ── MCP Health API tests ──────────────────────────────────────────────────

describe('meridianApi.mcpHealth', () => {
  it('returns reachable true when MCP server responds 200', async () => {
    const result = await meridianApi.mcpHealth();

    expect(result).toEqual({ reachable: true });
  });

  it('returns reachable false when MCP server returns non-200', async () => {
    server.use(
      http.get('http://localhost:8001/health', () => {
        return HttpResponse.json({ status: 'error' }, { status: 503 });
      }),
    );

    const result = await meridianApi.mcpHealth();

    expect(result).toEqual({ reachable: false });
  });

  it('returns reachable false when MCP server is unreachable', async () => {
    server.use(
      http.get('http://localhost:8001/health', () => {
        return HttpResponse.error();
      }),
    );

    const result = await meridianApi.mcpHealth();

    expect(result).toEqual({ reachable: false });
  });
});

describe('meridianApi.updateSettings', () => {
  it('sends the payload to POST /settings and returns updated config', async () => {
    const payload = {
      llm_provider: 'local' as const,
      retrieval_provider: 'chroma' as const,
      retrieval_threshold: 0.75,
      temperature: 0.3,
    };

    const result = await meridianApi.updateSettings(payload);

    expect(capturedBody).toEqual(payload);
    expect(result).toEqual({
      llm_provider: 'local',
      retrieval_provider: 'chroma',
      retrieval_threshold: 0.75,
      temperature: 0.3,
    });
  });
});
