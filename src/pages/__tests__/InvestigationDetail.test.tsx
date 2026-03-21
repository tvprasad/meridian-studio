// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InvestigationDetail } from '../InvestigationDetail';

import detailFixture from '../../__fixtures__/investigation-detail.json';

const TRACE_ID = 'OPS-1234-inv-20260320-143200';

const server = setupServer(
  http.get(`http://localhost:8000/ops/investigations/${encodeURIComponent(TRACE_ID)}`, () =>
    HttpResponse.json(detailFixture),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());

function renderDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/investigations/${encodeURIComponent(TRACE_ID)}`]}>
        <Routes>
          <Route path="/investigations/:traceId" element={<InvestigationDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Investigation detail page', () => {
  it('renders Jira key and status badge', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('OPS-1234')).toBeInTheDocument();
    });
    // Multiple "Awaiting Approval" badges (header + approval panel + timeline)
    expect(screen.getAllByText('Awaiting Approval').length).toBeGreaterThanOrEqual(1);
  });

  it('renders ticket summary', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/Payments ETL mismatch/)).toBeInTheDocument();
    });
  });

  it('renders workflow timeline', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Workflow Progress')).toBeInTheDocument();
    });
  });

  it('renders approval panel when AWAITING_APPROVAL', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Execution Plan')).toBeInTheDocument();
    });
    expect(screen.getByText(/Execution requires explicit approval/)).toBeInTheDocument();
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('renders audit trace with step count', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Audit Trace (11 steps)')).toBeInTheDocument();
    });
  });

  it('renders all actions audited badge', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('All actions audited')).toBeInTheDocument();
    });
  });

  it('renders metadata card', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Metadata')).toBeInTheDocument();
    });
  });
});
