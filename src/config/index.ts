export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  mcpBaseUrl: import.meta.env.VITE_MCP_BASE_URL || 'http://localhost:8001',
} as const;