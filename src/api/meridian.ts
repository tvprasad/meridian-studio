import { api } from './client';
import { config } from '../config';
import type { QueryResponse, HealthResponse, McpTool, UpdateSettingsPayload } from './types';

export const meridianApi = {
  // Routes to MCP server (port 8001)
  query: (question: string) =>
    api.post<QueryResponse>('/tools/call', { question }, { baseUrl: config.mcpBaseUrl }),

  // Routes to Meridian API (port 8000)
  health: () =>
    api.get<HealthResponse>('/health'),

  mcpTools: () =>
    api.get<{ tools: McpTool[] }>('/mcp/tools'),

  // POST /settings — backend must expose this to accept runtime config changes
  updateSettings: (payload: UpdateSettingsPayload) =>
    api.post<void>('/settings', payload),
};