import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { meridianApi } from '../meridian';

import queryRefused from '../../__fixtures__/query-refused.json';
import queryOk from '../../__fixtures__/query-ok.json';
import healthFixture from '../../__fixtures__/health.json';
import ingestFixture from '../../__fixtures__/ingest-success.json';

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
      answer: 'Meridian is a RAG-powered knowledge engine.',
      threshold: 0.6,
    }));
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
        'How do I rollback a deployment?',
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
