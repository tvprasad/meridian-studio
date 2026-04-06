// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config before importing the module under test
const mockConfig = {
  authEnabled: false,
  azure: { clientId: 'test-client', tenantId: 'test-tenant', redirectUri: 'http://localhost', apiScope: 'api://test/.default' },
  apiBaseUrl: 'http://localhost:8000',
  mcpBaseUrl: 'http://localhost:8001',
};

vi.mock('../../config', () => ({ config: mockConfig }));

const mockAcquireTokenSilent = vi.fn();
const mockAcquireTokenRedirect = vi.fn();
const mockGetAllAccounts = vi.fn();
const mockGetActiveAccount = vi.fn();

vi.mock('../msalConfig', () => ({
  getMsalInstance: () => ({
    getActiveAccount: mockGetActiveAccount,
    getAllAccounts: mockGetAllAccounts,
    acquireTokenSilent: mockAcquireTokenSilent,
    acquireTokenRedirect: mockAcquireTokenRedirect,
  }),
  loginRequest: { scopes: ['api://test/.default'] },
}));

// Import after mocks are set up
const { getAuthHeaders } = await import('../getAuthHeaders');

beforeEach(() => {
  vi.clearAllMocks();
  mockConfig.authEnabled = false;
  mockGetActiveAccount.mockReturnValue(null);
});

describe('getAuthHeaders', () => {
  it('returns empty object when auth is disabled', async () => {
    mockConfig.authEnabled = false;

    const headers = await getAuthHeaders();

    expect(headers).toEqual({});
    expect(mockGetAllAccounts).not.toHaveBeenCalled();
  });

  it('returns access token when API scope is configured', async () => {
    mockConfig.authEnabled = true;
    mockGetAllAccounts.mockReturnValue([{ username: 'user@example.com' }]);
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'access-token', idToken: 'test-id-token' });

    const headers = await getAuthHeaders();

    expect(headers).toEqual({ Authorization: 'Bearer access-token' });
    expect(mockAcquireTokenSilent).toHaveBeenCalledWith(
      expect.objectContaining({ account: { username: 'user@example.com' } }),
    );
  });

  it('falls back to ID token when no API scope is configured', async () => {
    mockConfig.authEnabled = true;
    mockConfig.azure.apiScope = '';
    mockGetAllAccounts.mockReturnValue([{ username: 'user@example.com' }]);
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: '', idToken: 'test-id-token' });

    const headers = await getAuthHeaders();

    expect(headers).toEqual({ Authorization: 'Bearer test-id-token' });
  });

  it('returns empty object when no accounts exist', async () => {
    mockConfig.authEnabled = true;
    mockGetAllAccounts.mockReturnValue([]);

    const headers = await getAuthHeaders();

    expect(headers).toEqual({});
    expect(mockAcquireTokenSilent).not.toHaveBeenCalled();
  });

  it('returns empty and does not redirect on InteractionRequiredAuthError', async () => {
    mockConfig.authEnabled = true;
    mockGetAllAccounts.mockReturnValue([{ username: 'user@example.com' }]);

    // Simulate InteractionRequiredAuthError (e.g. API scope not yet consented)
    const { InteractionRequiredAuthError } = await import('@azure/msal-browser');
    mockAcquireTokenSilent.mockRejectedValue(new InteractionRequiredAuthError('interaction_required'));

    const headers = await getAuthHeaders();

    // Must NOT redirect — redirecting from a per-request helper causes a loop.
    // Consent is handled by the AuthGuard login flow.
    expect(headers).toEqual({});
    expect(mockAcquireTokenRedirect).not.toHaveBeenCalled();
  });

  it('returns empty object on unexpected errors', async () => {
    mockConfig.authEnabled = true;
    mockGetAllAccounts.mockReturnValue([{ username: 'user@example.com' }]);
    mockAcquireTokenSilent.mockRejectedValue(new Error('network failure'));

    const headers = await getAuthHeaders();

    expect(headers).toEqual({});
    expect(mockAcquireTokenRedirect).not.toHaveBeenCalled();
  });
});
