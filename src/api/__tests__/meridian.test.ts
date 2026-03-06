import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { meridianApi } from '../meridian';

import mcpQueryRefused from '../../__fixtures__/mcp-query-refused.json';
import mcpQueryOk from '../../__fixtures__/mcp-query-ok.json';
import healthFixture from '../../__fixtures__/health.json';

// ── MSW server ──────────────────────────────────────────────────────────────

let capturedBody: unknown = null;

const server = setupServer(
  http.post('http://localhost:8001/tools/call', async ({ request }) => {
    capturedBody = await request.json();
    // Default to refused fixture; individual tests override via server.use()
    return HttpResponse.json(mcpQueryRefused);
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
  it('sends the correct MCP tools/call payload', async () => {
    await meridianApi.query('What is Meridian?');

    expect(capturedBody).toEqual({
      name: 'query_knowledge_base',
      arguments: { question: 'What is Meridian?' },
    });
  });

  it('maps a REFUSED MCP response to QueryResponse', async () => {
    const result = await meridianApi.query('What is Meridian?');

    expect(result).toEqual({
      status: 'REFUSED',
      trace_id: '3d41b36c-dd37-40c7-9394-c70b40b28187',
      confidence_score: 0.51432025,
      answer: undefined,
      refusal_reason: 'Retrieval confidence below threshold',
      threshold: 0.6,
    });
  });

  it('maps an OK MCP response to QueryResponse', async () => {
    server.use(
      http.post('http://localhost:8001/tools/call', async () => {
        return HttpResponse.json(mcpQueryOk);
      }),
    );

    const result = await meridianApi.query('What is Meridian?');

    expect(result).toEqual({
      status: 'OK',
      trace_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      confidence_score: 0.87,
      answer: 'Meridian is a RAG-powered knowledge engine.',
      refusal_reason: undefined,
      threshold: 0.6,
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
    });
  });
});
