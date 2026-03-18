// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../Dashboard';

import healthFixture from '../../__fixtures__/health.json';
import metricsFixture from '../../__fixtures__/evaluation-metrics.json';
import unconfiguredFixture from '../../__fixtures__/evaluation-unconfigured.json';

// ── MSW server ──────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('http://localhost:8000/health', () =>
    HttpResponse.json(healthFixture),
  ),
  http.get('http://localhost:8000/settings', () =>
    HttpResponse.json({ temperature: 0.7, retrieval_threshold: 0.45 }),
  ),
  http.get('http://localhost:8000/evaluation/metrics', () =>
    HttpResponse.json(metricsFixture),
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

describe('Dashboard — telemetry metrics', () => {
  it('renders evaluation metric cards when configured', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Query Telemetry')).toBeInTheDocument();
    });
    expect(screen.getByText('127')).toBeInTheDocument();
    expect(screen.getByText('72.3%')).toBeInTheDocument();
    expect(screen.getByText('15.8%')).toBeInTheDocument();
    expect(screen.getByText('View full telemetry')).toBeInTheDocument();
  });

  it('hides telemetry section when database is not configured', async () => {
    server.use(
      http.get('http://localhost:8000/evaluation/metrics', () =>
        HttpResponse.json(unconfiguredFixture),
      ),
    );
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    // Wait for health to load, then verify no telemetry section
    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });
    expect(screen.queryByText('Query Telemetry')).not.toBeInTheDocument();
  });
});
