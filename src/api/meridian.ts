import { api } from './client';
import { config } from '../config';
import type { QueryResponse, McpQueryResult, HealthResponse, McpTool, UpdateSettingsPayload, IngestResponse } from './types';

export const meridianApi = {
  // Routes to MCP server (port 8001)
  query: async (question: string): Promise<QueryResponse> => {
    const raw = await api.post<{ result: McpQueryResult }>('/tools/call', {
      name: 'query_knowledge_base',
      arguments: { question },
    }, { baseUrl: config.mcpBaseUrl });
    const r = raw.result;
    return {
      status: r.status as QueryResponse['status'],
      trace_id: r.trace_id,
      confidence_score: r.confidence,
      answer: r.answer,
      refusal_reason: r.reason,
      threshold: r.threshold,
    };
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