// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Runtimes } from '../Runtimes';
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext';

import listFixture from '../../__fixtures__/runtime-list.json';

const server = setupServer(
  http.get('http://localhost:8000/admin/runtimes', () =>
    HttpResponse.json(listFixture),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());

const mockAuth: AuthContextValue = {
  isAuthenticated: true,
  authEnabled: false,
  user: null,
  roles: [],
  getAccessToken: async () => null,
  login: async () => {},
  logout: async () => {},
};

function renderRuntimes() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <AuthContext.Provider value={mockAuth}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Runtimes />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe('Runtimes list page', () => {
  it('renders page title and governance footer', async () => {
    renderRuntimes();
    expect(screen.getByText('Runtime Environments')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Studio never calls AWS directly/)).toBeInTheDocument();
    });
  });

  it('renders KPI cards', async () => {
    renderRuntimes();
    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
    expect(screen.getByText('Provisioning')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders runtime rows from fixture', async () => {
    renderRuntimes();
    await waitFor(() => {
      expect(screen.getByText('staging-east')).toBeInTheDocument();
    });
    expect(screen.getByText('prod-us')).toBeInTheDocument();
    expect(screen.getByText('dev-eu')).toBeInTheDocument();
  });

  it('shows provisioning badge for active runtimes', async () => {
    renderRuntimes();
    await waitFor(() => {
      expect(screen.getByText('Provisioning Cluster')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Ready').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows cloud labels', async () => {
    renderRuntimes();
    await waitFor(() => {
      expect(screen.getAllByText('AWS').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('Azure')).toBeInTheDocument();
  });

  it('renders Provision Runtime link', () => {
    renderRuntimes();
    expect(screen.getByText('Provision Runtime')).toBeInTheDocument();
  });
});
