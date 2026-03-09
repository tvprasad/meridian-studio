import { api, ApiError } from './client';
import { config } from '../config';
import type { QueryResponse, HealthResponse, McpTool, UpdateSettingsPayload, IngestResponse } from './types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
      const res = await fetch(`${config.apiBaseUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Routes to Meridian API (port 8000)
  health: () =>
    api.get<HealthResponse>('/health'),

  mcpTools: () =>
    api.get<{ tools: McpTool[] }>('/mcp/tools'),

  // POST /ingest — upload documents for ingestion into the knowledge base
  ingest: (formData: FormData) =>
    api.postForm<IngestResponse>('/ingest', formData, { timeoutMs: 120_000 }),

  // POST /settings — backend must expose this to accept runtime config changes
  updateSettings: (payload: UpdateSettingsPayload) =>
    api.post<void>('/settings', payload),
};