// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Investigations } from '../Investigations';

import listFixture from '../../__fixtures__/investigation-list.json';

const server = setupServer(
  http.get('http://localhost:8000/ops/investigations', () =>
    HttpResponse.json(listFixture),
  ),
  http.get('http://localhost:8000/ops/investigations/pending', () =>
    HttpResponse.json(['OPS-1234-inv-20260320-143200']),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { cleanup(); server.resetHandlers(); });
afterAll(() => server.close());

function renderInvestigations() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Investigations />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Investigations list page', () => {
  it('renders page title and governance footer', async () => {
    renderInvestigations();
    expect(screen.getByText('Investigations')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/No execution occurs without explicit approval/)).toBeInTheDocument();
    });
  });

  it('renders KPI cards', async () => {
    renderInvestigations();
    await waitFor(() => {
      expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('Awaiting Approval').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Rejected / Expired')).toBeInTheDocument();
  });

  it('renders investigation rows from fixture', async () => {
    renderInvestigations();
    await waitFor(() => {
      expect(screen.getByText('OPS-1234')).toBeInTheDocument();
    });
    expect(screen.getByText('OPS-1100')).toBeInTheDocument();
    expect(screen.getByText('OPS-1050')).toBeInTheDocument();
  });

  it('shows status badges for each investigation', async () => {
    renderInvestigations();
    // Wait for table rows to render (OPS-1234 confirms data is loaded)
    await waitFor(() => {
      expect(screen.getByText('OPS-1234')).toBeInTheDocument();
    });
    // Badge text appears in both KPI cards and table rows
    expect(screen.getAllByText('Awaiting Approval').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    // 'Rejected' appears as a badge label in table row
    expect(screen.getAllByText('Rejected').length).toBeGreaterThanOrEqual(1);
  });

  it('renders search input', () => {
    renderInvestigations();
    expect(screen.getByPlaceholderText(/Search by Jira key/)).toBeInTheDocument();
  });
});
