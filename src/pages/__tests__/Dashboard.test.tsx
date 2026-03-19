// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE in details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../Dashboard';

import healthFixture from '../../__fixtures__/health.json';

// ── MSW server ──────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('http://localhost:8000/health', () =>
    HttpResponse.json(healthFixture),
  ),
  http.get('http://localhost:8000/settings', () =>
    HttpResponse.json({ temperature: 0.7, retrieval_threshold: 0.45 }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Dashboard — telemetry section', () => {
  it('renders Query Telemetry label and link', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Query Telemetry')).toBeInTheDocument();
    });
    expect(screen.getByText('View full telemetry')).toBeInTheDocument();
    expect(screen.getByText(/Retrieval confidence/)).toBeInTheDocument();
  });

  it('renders configuration cards from health response', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
