// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock config
const mockConfig = {
  authEnabled: false,
  azure: { clientId: 'test-client', tenantId: 'test-tenant', redirectUri: 'http://localhost', apiScope: 'api://test/.default' },
  apiBaseUrl: 'http://localhost:8000',
  mcpBaseUrl: 'http://localhost:8001',
};

vi.mock('../../config', () => ({ config: mockConfig }));

vi.mock('../msalConfig', () => ({
  getMsalInstance: () => ({
    initialize: () => Promise.resolve(),
    getAllAccounts: () => [],
    acquireTokenSilent: () => Promise.resolve({ accessToken: 'test' }),
  }),
  loginRequest: { scopes: [] },
}));

// Mock @azure/msal-react to avoid real MSAL initialization in tests
vi.mock('@azure/msal-react', () => ({
  MsalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMsal: () => ({
    instance: {
      acquireTokenSilent: () => Promise.resolve({ accessToken: 'test' }),
      loginRedirect: () => Promise.resolve(),
      logoutRedirect: () => Promise.resolve(),
    },
    accounts: [],
  }),
  useIsAuthenticated: () => false,
}));

// Import after mocks
const { AuthProvider } = await import('../AuthProvider');

function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="auth-enabled">{String(auth.authEnabled)}</span>
      <span data-testid="roles">{auth.roles.join(',')}</span>
    </div>
  );
}

beforeEach(() => {
  mockConfig.authEnabled = false;
});

describe('AuthProvider', () => {
  it('provides open context when auth is disabled', () => {
    mockConfig.authEnabled = false;

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('auth-enabled')).toHaveTextContent('false');
    expect(screen.getByTestId('roles')).toHaveTextContent('operator');
  });

  it('getAccessToken returns null when auth is disabled', async () => {
    mockConfig.authEnabled = false;
    const tokenRef = { current: 'not-null' as string | null };

    function TokenConsumer() {
      const auth = useAuth();
      // Use useEffect-like pattern to avoid side effects during render
      return <span data-testid="token-check" onClick={() => {
        auth.getAccessToken().then((t) => { tokenRef.current = t; });
      }} />;
    }

    render(
      <AuthProvider>
        <TokenConsumer />
      </AuthProvider>,
    );

    // Call getAccessToken directly from the context
    const el = screen.getByTestId('token-check');
    el.click();

    await vi.waitFor(() => expect(tokenRef.current).toBeNull());
  });
});
