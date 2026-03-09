import { api } from './client';
import type { QueryResponse, HealthResponse, McpTool, UpdateSettingsPayload, IngestResponse } from './types';

export const meridianApi = {
  // Routes to Meridian API (port 8000) — direct query, no MCP indirection
  query: async (question: string): Promise<QueryResponse> => {
    return api.post<QueryResponse>('/query', { question }, { timeoutMs: 90_000 });
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