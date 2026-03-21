// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PendingBadge } from '../PendingBadge';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());

function renderBadge() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PendingBadge />
    </QueryClientProvider>,
  );
}

describe('PendingBadge', () => {
  it('renders count when there are pending investigations', async () => {
    server.use(
      http.get('http://localhost:8000/ops/investigations/pending', () =>
        HttpResponse.json([
          { trace_id: 't1', jira_key: 'OPS-1', jira_url: '', status: 'AWAITING_APPROVAL', title: '', investigation_type: '', confidence: null, created_at: '', step_count: 0, is_terminal: false },
          { trace_id: 't2', jira_key: 'OPS-2', jira_url: '', status: 'AWAITING_APPROVAL', title: '', investigation_type: '', confidence: null, created_at: '', step_count: 0, is_terminal: false },
          { trace_id: 't3', jira_key: 'OPS-3', jira_url: '', status: 'AWAITING_APPROVAL', title: '', investigation_type: '', confidence: null, created_at: '', step_count: 0, is_terminal: false },
        ]),
      ),
    );
    renderBadge();
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('renders nothing when list is empty', async () => {
    server.use(
      http.get('http://localhost:8000/ops/investigations/pending', () =>
        HttpResponse.json([]),
      ),
    );
    const { container } = renderBadge();
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('caps display at 99+', async () => {
    server.use(
      http.get('http://localhost:8000/ops/investigations/pending', () =>
        HttpResponse.json(
          Array.from({ length: 150 }, (_, i) => ({
            trace_id: `t${i}`, jira_key: `OPS-${i}`, jira_url: '', status: 'AWAITING_APPROVAL',
            title: '', investigation_type: '', confidence: null, created_at: '', step_count: 0, is_terminal: false,
          })),
        ),
      ),
    );
    renderBadge();
    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});
