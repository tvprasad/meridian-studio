// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditTrace } from '../AuditTrace';
import type { StepRecord } from '../../../api/investigation';

const SAMPLE_STEPS: StepRecord[] = [
  {
    trace_id: 'OPS-1234', step_number: 1, agent_role: 'intake',
    action: 'Classified ticket as data_quality',
    status_before: 'INTAKE', status_after: 'INTAKE',
    tool_name: 'classify_ticket', tool_input_hash: 'sha256:7g8h9i',
    tool_output_hash: 'sha256:a1b2c3', approval_ref: null, plan_id: null,
    timestamp: '2026-03-20T14:32:00.000Z', elapsed_ms: 1200,
  },
  {
    trace_id: 'OPS-1234', step_number: 2, agent_role: 'machine',
    action: 'transition INTAKE to RESEARCH',
    status_before: 'INTAKE', status_after: 'RESEARCH',
    tool_name: null, tool_input_hash: null, tool_output_hash: null,
    approval_ref: null, plan_id: null,
    timestamp: '2026-03-20T14:32:05.000Z', elapsed_ms: 0,
  },
  {
    trace_id: 'OPS-1234', step_number: 3, agent_role: 'execution',
    action: 'Executed db_write step 1',
    status_before: 'EXECUTING', status_after: 'EXECUTING',
    tool_name: 'db_write', tool_input_hash: 'sha256:exec1',
    tool_output_hash: 'sha256:exec2', approval_ref: 'studio-OPS-1234-abc',
    plan_id: 'PLAN-OPS-1234-001',
    timestamp: '2026-03-20T14:40:00.000Z', elapsed_ms: 2300,
  },
];

describe('AuditTrace', () => {
  it('renders empty state when no steps', () => {
    render(<AuditTrace steps={[]} />);
    expect(screen.getByText('No audit steps recorded yet.')).toBeInTheDocument();
  });

  it('renders step numbers', () => {
    render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders agent role badges and action descriptions', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(container.textContent).toContain('Intake');
    expect(container.textContent).toContain('Execution');
    expect(container.textContent).toContain('Classified ticket as data_quality');
    expect(container.textContent).toContain('Executed db_write step 1');
  });

  it('renders tool names when present', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(container.textContent).toContain('classify_ticket');
    expect(container.textContent).toContain('db_write');
  });

  it('renders state transitions', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    // Step 2 transitions INTAKE -> RESEARCH
    expect(container.textContent).toContain('INTAKE');
    expect(container.textContent).toContain('RESEARCH');
  });

  it('renders truncated input/output hashes (no sensitive data)', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(container.textContent).toContain('in:sha256:7');
    expect(container.textContent).toContain('out:sha256:a');
  });

  it('renders approval ref and plan ID on execution steps', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(container.textContent).toContain('studio-OPS-1234-abc');
    expect(container.textContent).toContain('plan:PLAN-OPS-123');
  });

  it('renders elapsed time', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(container.textContent).toContain('1.2s');
    expect(container.textContent).toContain('2.3s');
  });

  it('renders trace integrity footer with step count', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(container.textContent).toContain('3 steps recorded');
    expect(container.textContent).toContain('all actions audited');
  });
});
