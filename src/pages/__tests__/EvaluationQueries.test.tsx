// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { EvaluationQueries } from '../EvaluationQueries';

import metricsFixture from '../../__fixtures__/evaluation-metrics.json';
import queriesFixture from '../../__fixtures__/evaluation-queries.json';
import unconfiguredFixture from '../../__fixtures__/evaluation-unconfigured.json';

// ── MSW server ──────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('http://localhost:8000/evaluation/metrics', () =>
    HttpResponse.json(metricsFixture),
  ),
  http.get('http://localhost:8000/evaluation/queries', () =>
    HttpResponse.json(queriesFixture),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderEvaluation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EvaluationQueries />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('EvaluationQueries — initial load', () => {
  it('renders metric cards with fixture data', async () => {
    renderEvaluation();
    await waitFor(() => {
      expect(screen.getByText('127')).toBeInTheDocument();
    });
    expect(screen.getByText('72.3%')).toBeInTheDocument();
    expect(screen.getByText('15.8%')).toBeInTheDocument();
  });

  it('renders query log rows', async () => {
    renderEvaluation();
    await waitFor(() => {
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    });
    expect(screen.getByText('What is the vacation policy for contractors?')).toBeInTheDocument();
    expect(screen.getByText('Why are login requests failing for region us-east?')).toBeInTheDocument();
  });
});

describe('EvaluationQueries — unconfigured', () => {
  it('shows database not configured message', async () => {
    server.use(
      http.get('http://localhost:8000/evaluation/metrics', () =>
        HttpResponse.json(unconfiguredFixture),
      ),
      http.get('http://localhost:8000/evaluation/queries', () =>
        HttpResponse.json(unconfiguredFixture),
      ),
    );
    renderEvaluation();
    await waitFor(() => {
      expect(screen.getByText('Database not configured')).toBeInTheDocument();
    });
  });
});

describe('EvaluationQueries — API error on initial load', () => {
  it('shows error state instead of empty state when queries endpoint fails', async () => {
    server.use(
      http.get('http://localhost:8000/evaluation/queries', () =>
        HttpResponse.error(),
      ),
    );
    renderEvaluation();
    await waitFor(() => {
      expect(screen.getByText('Unable to load telemetry data.')).toBeInTheDocument();
    });
    expect(screen.getByText(/database may be waking up/)).toBeInTheDocument();
    // Must NOT show the "no data" empty state
    expect(screen.queryByText('No telemetry data recorded yet.')).not.toBeInTheDocument();
  });

  it('shows skeleton cards when metrics endpoint fails', async () => {
    server.use(
      http.get('http://localhost:8000/evaluation/metrics', () =>
        HttpResponse.error(),
      ),
    );
    renderEvaluation();
    // Queries should still load and render rows
    await waitFor(() => {
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    });
    // Metric cards should NOT show "No telemetry" — they should show skeleton or nothing
    expect(screen.queryByText('127')).not.toBeInTheDocument();
  });
});

describe('EvaluationQueries — expandable rows', () => {
  it('expands an OK row to show answer and citations', async () => {
    renderEvaluation();
    await waitFor(() => {
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    });

    // Row should not show answer text initially
    expect(screen.queryByText(/navigate to the login page/)).not.toBeInTheDocument();

    // Click the row
    fireEvent.click(screen.getByText('How do I reset my password?'));

    // Answer text should appear
    await waitFor(() => {
      expect(screen.getByText(/navigate to the login page/)).toBeInTheDocument();
    });
    // Citations should appear
    expect(screen.getByText('Password Reset Guide')).toBeInTheDocument();
    expect(screen.getByText('Account Management')).toBeInTheDocument();
  });

  it('expands a REFUSED row to show governed refusal message', async () => {
    renderEvaluation();
    await waitFor(() => {
      expect(screen.getByText('What is the vacation policy for contractors?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('What is the vacation policy for contractors?'));

    await waitFor(() => {
      expect(screen.getByText(/confidence.*fell below the retrieval threshold/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Password Reset Guide/)).not.toBeInTheDocument();
  });

  it('collapses an expanded row when clicked again', async () => {
    renderEvaluation();
    await waitFor(() => {
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    });

    const rowText = screen.getByText('How do I reset my password?');
    fireEvent.click(rowText);
    await waitFor(() => {
      expect(screen.getByText(/navigate to the login page/)).toBeInTheDocument();
    });

    fireEvent.click(rowText);
    await waitFor(() => {
      expect(screen.queryByText(/navigate to the login page/)).not.toBeInTheDocument();
    });
  });

  it('only shows one expanded row at a time', async () => {
    renderEvaluation();
    await waitFor(() => {
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('How do I reset my password?'));
    await waitFor(() => {
      expect(screen.getByText(/navigate to the login page/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Why are login requests failing for region us-east?'));
    await waitFor(() => {
      expect(screen.getByText(/expired TLS certificate/)).toBeInTheDocument();
    });

    // First row should now be collapsed
    expect(screen.queryByText(/navigate to the login page/)).not.toBeInTheDocument();
  });
});

describe('EvaluationQueries — data persistence during refetch', () => {
  it('keeps previous data visible when a refetch fails', async () => {
    renderEvaluation();

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    });

    // Simulate backend failure on next request
    server.use(
      http.get('http://localhost:8000/evaluation/queries', () =>
        HttpResponse.error(),
      ),
    );

    // Previous data should still be visible (keepPreviousData)
    expect(screen.getByText('How do I reset my password?')).toBeInTheDocument();
    expect(screen.getByText('127')).toBeInTheDocument();

    // "No telemetry data" empty state should NOT appear
    expect(screen.queryByText('No telemetry data recorded yet.')).not.toBeInTheDocument();
  });
});
