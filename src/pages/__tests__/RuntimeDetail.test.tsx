// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RuntimeDetail } from '../RuntimeDetail';
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext';

import detailFixture from '../../__fixtures__/runtime-detail.json';

const server = setupServer(
  http.get('http://localhost:8000/admin/runtimes/rt-001-abc', () =>
    HttpResponse.json(detailFixture),
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

function renderDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <AuthContext.Provider value={mockAuth}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/runtimes/rt-001-abc']}>
          <Routes>
            <Route path="/admin/runtimes/:runtimeId" element={<RuntimeDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe('RuntimeDetail page', () => {
  it('renders runtime name and status badge', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('staging-east')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Provisioning Cluster').length).toBeGreaterThanOrEqual(1);
  });

  it('renders provisioning progress timeline', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Provisioning Progress')).toBeInTheDocument();
    });
  });

  it('renders configuration section', async () => {
    const { container } = renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });
    expect(container.textContent).toContain('cluster name');
    expect(container.textContent).toContain('meridian-staging-east');
  });

  it('renders progress log with steps', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Progress Log')).toBeInTheDocument();
    });
    expect(screen.getByText('Runtime environment created')).toBeInTheDocument();
  });

  it('renders metadata section', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Metadata')).toBeInTheDocument();
    });
  });

  it('shows polling indicator for active runtime', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/Polling every 3 seconds/)).toBeInTheDocument();
    });
  });

  it('renders governance footer', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/No cloud credentials are exposed/)).toBeInTheDocument();
    });
  });
});
