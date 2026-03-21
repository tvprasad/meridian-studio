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
  it('renders count when there are pending approvals', async () => {
    server.use(
      http.get('http://localhost:8000/ops/investigations/pending', () =>
        HttpResponse.json(['trace-1', 'trace-2', 'trace-3']),
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
    // Wait for query to settle
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('caps display at 99+', async () => {
    server.use(
      http.get('http://localhost:8000/ops/investigations/pending', () =>
        HttpResponse.json(Array.from({ length: 150 }, (_, i) => `trace-${i}`)),
      ),
    );
    renderBadge();
    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});
