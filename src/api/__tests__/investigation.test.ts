// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { investigationApi, TERMINAL_STATES } from '../investigation';
import type { InvestigationStatus } from '../investigation';

import listFixture from '../../__fixtures__/investigation-list.json';
import detailFixture from '../../__fixtures__/investigation-detail.json';

const server = setupServer(
  http.get('http://localhost:8000/ops/investigations', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    if (status) {
      const filtered = (listFixture as typeof listFixture).filter((i) => i.status === status);
      return HttpResponse.json(filtered);
    }
    return HttpResponse.json(listFixture);
  }),
  http.get('http://localhost:8000/ops/investigations/pending', () =>
    HttpResponse.json(listFixture.filter((i) => i.status === 'AWAITING_APPROVAL')),
  ),
  http.get('http://localhost:8000/ops/investigations/OPS-1234-inv-20260320-143200', () =>
    HttpResponse.json(detailFixture),
  ),
  http.post('http://localhost:8000/ops/approve', () =>
    HttpResponse.json({ trace_id: 'OPS-1234-inv-20260320-143200', status: 'APPROVED', approval_ref: 'studio-ref-123' }),
  ),
  http.post('http://localhost:8000/ops/reject', () =>
    HttpResponse.json({ trace_id: 'OPS-1234-inv-20260320-143200', status: 'REJECTED' }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('investigationApi', () => {
  it('list() returns array of InvestigationSummary', async () => {
    const result = await investigationApi.list();
    expect(result).toHaveLength(3);
    expect(result[0].jira_key).toBe('OPS-1234');
    expect(result[0].title).toBe('Payments ETL mismatch in settlement totals');
    expect(result[0].confidence).toBe(0.87);
    expect(result[0].is_terminal).toBe(false);
  });

  it('list() passes status filter', async () => {
    const result = await investigationApi.list('AWAITING_APPROVAL');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('AWAITING_APPROVAL');
  });

  it('get() returns InvestigationDetail with safe DTO fields', async () => {
    const result = await investigationApi.get('OPS-1234-inv-20260320-143200');
    expect(result.trace_id).toBe('OPS-1234-inv-20260320-143200');
    expect(result.title).toBe('Payments ETL mismatch in settlement totals');
    expect(result.description).toBeTruthy();
    expect(result.confidence).toBe(0.87);
    expect(result.root_cause_hypothesis).toBeTruthy();
    expect(result.severity).toBe('high');
    expect(result.findings).toHaveLength(3);
    expect(result.steps).toHaveLength(11);
    expect(result.step_count).toBe(11);
  });

  it('get() returns execution plan summary (no raw parameters)', async () => {
    const result = await investigationApi.get('OPS-1234-inv-20260320-143200');
    const plan = result.execution_plan!;
    expect(plan.plan_id).toBe('PLAN-OPS-1234-001');
    expect(plan.blast_radius).toBe('medium');
    expect(plan.total_steps).toBe(2);
    expect(plan.reversible).toBe(true);
    // No raw parameters, preconditions, or rollback commands in the summary DTO
    expect((plan as unknown as Record<string, unknown>)['steps']).toBeUndefined();
  });

  it('get() returns finding summaries (no tool queries or hashes)', async () => {
    const result = await investigationApi.get('OPS-1234-inv-20260320-143200');
    const finding = result.findings[0];
    expect(finding.id).toBe('F-001');
    expect(finding.source).toBe('postgres_payments');
    expect(finding.summary).toBeTruthy();
    // No tool_used, query, raw_result_hash in the safe DTO
    expect((finding as unknown as Record<string, unknown>)['tool_used']).toBeUndefined();
    expect((finding as unknown as Record<string, unknown>)['query']).toBeUndefined();
  });

  it('pendingList() returns InvestigationSummary[]', async () => {
    const result = await investigationApi.pendingList();
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('AWAITING_APPROVAL');
    expect(result[0].jira_key).toBe('OPS-1234');
  });

  it('approve() sends trace_id and approval_ref', async () => {
    const result = await investigationApi.approve('OPS-1234-inv-20260320-143200', 'studio-ref-123', 'PLAN-001');
    expect(result.trace_id).toBe('OPS-1234-inv-20260320-143200');
    expect(result.status).toBe('APPROVED');
  });

  it('reject() sends trace_id and reason', async () => {
    const result = await investigationApi.reject('OPS-1234-inv-20260320-143200', 'Needs review');
    expect(result.trace_id).toBe('OPS-1234-inv-20260320-143200');
    expect(result.status).toBe('REJECTED');
  });
});

describe('TERMINAL_STATES', () => {
  it('contains all terminal statuses', () => {
    const expected: InvestigationStatus[] = [
      'NO_ACTION_REQUIRED', 'INSUFFICIENT_DATA', 'REJECTED', 'EXPIRED', 'COMPLETED', 'FAILED',
    ];
    expected.forEach((s) => expect(TERMINAL_STATES.has(s)).toBe(true));
  });

  it('does not contain active statuses', () => {
    const active: InvestigationStatus[] = [
      'INTAKE', 'RESEARCH', 'DATA_ANALYSIS', 'POLICY_EVALUATE', 'AWAITING_APPROVAL', 'APPROVED', 'EXECUTING',
    ];
    active.forEach((s) => expect(TERMINAL_STATES.has(s)).toBe(false));
  });
});
