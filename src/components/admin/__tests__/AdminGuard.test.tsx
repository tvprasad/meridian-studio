// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminGuard } from '../AdminGuard';
import { AuthContext, type AuthContextValue } from '../../../auth/AuthContext';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    isAuthenticated: true,
    authEnabled: true,
    user: null,
    roles: [],
    getAccessToken: async () => null,
    login: async () => {},
    logout: async () => {},
    ...overrides,
  };
}

function renderGuard(auth: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={queryClient}>
        <AdminGuard>
          <div data-testid="protected-content">Admin Content</div>
        </AdminGuard>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe('AdminGuard', () => {
  it('renders children when auth is disabled', () => {
    renderGuard(makeAuth({ authEnabled: false }));
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders children when whoami returns is_admin: true', async () => {
    server.use(
      http.get('http://localhost:8000/admin/roles/whoami', () =>
        HttpResponse.json({ is_admin: true, email: 'admin@test.com', roles: ['operator'] }),
      ),
    );
    renderGuard(makeAuth());
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('shows access restricted when whoami returns is_admin: false', async () => {
    server.use(
      http.get('http://localhost:8000/admin/roles/whoami', () =>
        HttpResponse.json({ is_admin: false }),
      ),
    );
    renderGuard(makeAuth());
    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('shows access restricted when whoami returns 403', async () => {
    server.use(
      http.get('http://localhost:8000/admin/roles/whoami', () =>
        HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }),
      ),
    );
    renderGuard(makeAuth());
    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while whoami is pending', () => {
    server.use(
      http.get('http://localhost:8000/admin/roles/whoami', () =>
        new Promise(() => {}), // never resolves
      ),
    );
    renderGuard(makeAuth());
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Access Restricted')).not.toBeInTheDocument();
  });

  it('shows session-not-ready message (not Access Restricted) when whoami returns 401', async () => {
    server.use(
      http.get('http://localhost:8000/admin/roles/whoami', () =>
        HttpResponse.json({ detail: 'Missing Bearer token' }, { status: 401 }),
      ),
    );
    renderGuard(makeAuth());
    await waitFor(() => {
      expect(screen.getByText('Session not ready')).toBeInTheDocument();
    });
    // Must NOT show "Access Restricted" for auth errors
    expect(screen.queryByText('Access Restricted')).not.toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    // Retry button is present
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
