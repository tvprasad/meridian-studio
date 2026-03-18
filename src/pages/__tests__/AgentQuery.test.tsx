// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AgentQuery } from '../AgentQuery';

import agentFixture from '../../__fixtures__/agent-query-ok.json';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = () => {};

// ── MSW server ──────────────────────────────────────────────────────────────

const server = setupServer(
  http.post('http://localhost:8000/agent/query', () =>
    HttpResponse.json(agentFixture),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderAgent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AgentQuery />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function submitAndExpand(user: ReturnType<typeof userEvent.setup>) {
  const textarea = screen.getByRole('textbox');
  await user.type(textarea, 'Why are login requests failing?');
  await user.click(screen.getByRole('button', { name: /Send/ }));

  // Wait for answer to render
  await waitFor(() => {
    expect(screen.getByText(/expired TLS certificate/)).toBeInTheDocument();
  });

  // Expand reasoning steps
  await user.click(screen.getByText(/Reasoning steps/));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('AgentQuery — KB step confidence', () => {
  it('shows ConfidencePill on query_knowledge_base step', async () => {
    const user = userEvent.setup();
    renderAgent();
    await submitAndExpand(user);

    // The KB step (step 3) should show a confidence pill inline
    // 76.0% -> 82.0% (raw -> calibrated)
    expect(screen.getByText('76.0% → 82.0%')).toBeInTheDocument();
  });

  it('does not show ConfidencePill on non-KB steps', async () => {
    const user = userEvent.setup();
    renderAgent();
    await submitAndExpand(user);

    // 4 steps total, but only 1 has confidence
    const pills = screen.getAllByText(/→/);
    expect(pills).toHaveLength(1);
  });

  it('renders all 4 steps in the timeline', async () => {
    const user = userEvent.setup();
    renderAgent();
    await submitAndExpand(user);

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
    expect(screen.getByText('Step 4')).toBeInTheDocument();
    expect(screen.getByText('search_incidents')).toBeInTheDocument();
    expect(screen.getByText('query_knowledge_base')).toBeInTheDocument();
    expect(screen.getByText('query_metrics')).toBeInTheDocument();
  });
});
