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
    HttpResponse.json(['OPS-1234-inv-20260320-143200']),
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
  it('list() returns array of investigations', async () => {
    const result = await investigationApi.list();
    expect(result).toHaveLength(3);
    expect(result[0].jira_key).toBe('OPS-1234');
  });

  it('list() passes status filter', async () => {
    const result = await investigationApi.list('AWAITING_APPROVAL');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('AWAITING_APPROVAL');
  });

  it('get() returns full investigation state', async () => {
    const result = await investigationApi.get('OPS-1234-inv-20260320-143200');
    expect(result.trace_id).toBe('OPS-1234-inv-20260320-143200');
    expect(result.jira_key).toBe('OPS-1234');
    expect(result.status).toBe('AWAITING_APPROVAL');
    expect(result.step_log).toHaveLength(11);
    expect(result.investigation_plan).not.toBeNull();
    expect(result.evidence).not.toBeNull();
    expect(result.analysis).not.toBeNull();
    expect(result.policy_decision).not.toBeNull();
  });

  it('get() returns valid execution plan in policy decision', async () => {
    const result = await investigationApi.get('OPS-1234-inv-20260320-143200');
    const plan = result.policy_decision!.execution_plan!;
    expect(plan.plan_id).toBe('PLAN-OPS-1234-001');
    expect(plan.plan_hash).toBeTruthy();
    expect(plan.steps).toHaveLength(2);
    expect(plan.blast_radius).toBe('medium');
    expect(plan.reversible).toBe(true);
    plan.steps.forEach((step) => {
      expect(step.rollback_command).toBeTruthy();
      expect(step.precondition).toBeTruthy();
    });
  });

  it('pendingTraceIds() returns array of trace IDs', async () => {
    const result = await investigationApi.pendingTraceIds();
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('OPS-1234-inv-20260320-143200');
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
