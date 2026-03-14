import { api, ApiError } from './client';
import { config } from '../config';
import { getAuthHeaders } from '../auth/getAuthHeaders';
import type { QueryResponse, HealthResponse, SettingsResponse, McpTool, UpdateSettingsPayload, IngestResponse, ServiceNowIngestRequest, ServiceNowIngestResponse, ServiceNowStatusResponse, AgentQueryResponse, EvaluationQueriesResponse, EvaluationMetricsResponse, StreamEvent } from './types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Parse an SSE text/event-stream response body into typed StreamEvent objects.
 * Handles chunked boundaries — buffers partial events until a full
 * `event: ...\ndata: ...\n\n` block is received.
 */
async function* parseSSE(response: Response): AsyncGenerator<StreamEvent> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split on double-newline (SSE event boundary)
    const blocks = buffer.split('\n\n');
    // Last element may be incomplete — keep it in the buffer
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      const lines = trimmed.split('\n');
      let eventType = '';
      let dataStr = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7);
        } else if (line.startsWith('data: ')) {
          dataStr = line.slice(6);
        }
      }

      if (eventType && dataStr) {
        try {
          const data = JSON.parse(dataStr);
          yield { type: eventType, data } as StreamEvent;
        } catch {
          // Skip malformed events
        }
      }
    }
  }
}

export const meridianApi = {
  // Routes to Meridian API (port 8000) — direct query, no MCP indirection
  // HTTP 422 = REFUSED (governance gate) — valid QueryResponse, not an error
  query: async (question: string, conversationHistory?: ChatMessage[]): Promise<QueryResponse> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      const body: Record<string, unknown> = { question };
      if (conversationHistory?.length) {
        body.conversation_history = conversationHistory;
      }
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${config.apiBaseUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok || res.status === 422) return data as QueryResponse;
      throw new ApiError(data.detail || `Request failed: ${res.statusText}`, res.status);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError('Request timed out after 90000ms', 0);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  },

  // Streaming variant — POST /query?stream=true, returns SSE events (ADR-0010)
  queryStream: async function* (question: string, conversationHistory?: ChatMessage[]): AsyncGenerator<StreamEvent> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      const body: Record<string, unknown> = { question };
      if (conversationHistory?.length) {
        body.conversation_history = conversationHistory;
      }
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${config.apiBaseUrl}/query?stream=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new ApiError(errorData.detail || `Request failed: ${res.statusText}`, res.status);
      }

      yield* parseSSE(res);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError('Request timed out after 90000ms', 0);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  },

  // Routes to Meridian API (port 8000)
  health: () =>
    api.get<HealthResponse>('/health'),

  mcpTools: () =>
    api.get<{ tools: McpTool[] }>('/mcp/tools'),

  // POST /ingest — upload documents for ingestion into the knowledge base
  ingest: (formData: FormData) =>
    api.postForm<IngestResponse>('/ingest', formData, { timeoutMs: 120_000 }),

  // GET /settings — read current runtime configuration
  getSettings: () =>
    api.get<SettingsResponse>('/settings'),

  // POST /settings — update runtime configuration (in-memory, reset on restart)
  updateSettings: (payload: UpdateSettingsPayload) =>
    api.post<SettingsResponse>('/settings', payload),

  // POST /ingest/servicenow — sync articles from a ServiceNow knowledge base
  ingestServiceNow: (payload: ServiceNowIngestRequest) =>
    api.post<ServiceNowIngestResponse>('/ingest/servicenow', payload, { timeoutMs: 120_000 }),

  // GET /ingest/servicenow/status — check connection state and sync history
  serviceNowStatus: () =>
    api.get<ServiceNowStatusResponse>('/ingest/servicenow/status'),

  // POST /agent/query — AI Operations Agent with ReAct reasoning
  agentQuery: (question: string) =>
    api.post<AgentQueryResponse>('/agent/query', { question }, { timeoutMs: 120_000 }),

  // GET /evaluation/queries — paginated query log entries
  evaluationQueries: (limit = 50, offset = 0) =>
    api.get<EvaluationQueriesResponse>('/evaluation/queries', {
      params: { limit: String(limit), offset: String(offset) },
    }),

  // GET /evaluation/metrics — aggregate telemetry metrics
  evaluationMetrics: (since?: string) =>
    api.get<EvaluationMetricsResponse>('/evaluation/metrics', {
      ...(since && { params: { since } }),
    }),

  // PATCH /evaluation/queries/{trace_id}/feedback — submit human rating
  submitFeedback: (traceId: string, rating: 'up' | 'down' | null) =>
    api.post<void>(`/evaluation/queries/${traceId}/feedback`, { rating }),

  // GET MCP server health — lightweight reachability check
  mcpHealth: async (): Promise<{ reachable: boolean }> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${config.mcpBaseUrl}/health`, {
        signal: controller.signal,
        headers: { ...authHeaders },
      });
      clearTimeout(timeout);
      return { reachable: res.ok };
    } catch {
      return { reachable: false };
    }
  },
};