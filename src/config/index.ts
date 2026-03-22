// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  mcpBaseUrl: import.meta.env.VITE_MCP_BASE_URL || 'http://localhost:8001',
  authEnabled: import.meta.env.VITE_AUTH_ENABLED === 'true',
  azure: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    tenantId: import.meta.env.VITE_AZURE_TENANT_ID || '',
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    apiScope: import.meta.env.VITE_AZURE_API_SCOPE || '',
  },
  appInsightsConnectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING || '',
  adminEmails: (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean),
} as const;