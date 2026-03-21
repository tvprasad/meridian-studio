// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditTrace } from '../AuditTrace';
import type { StepSummary } from '../../../api/investigation';

const SAMPLE_STEPS: StepSummary[] = [
  { step_number: 1, agent_role: 'intake', action: 'Classified ticket as data_quality', status_before: 'INTAKE', status_after: 'INTAKE', timestamp: '2026-03-20T14:32:00.000Z', elapsed_ms: 1200 },
  { step_number: 2, agent_role: 'machine', action: 'transition INTAKE to RESEARCH', status_before: 'INTAKE', status_after: 'RESEARCH', timestamp: '2026-03-20T14:32:05.000Z', elapsed_ms: 0 },
  { step_number: 3, agent_role: 'research', action: 'Queried postgres_payments', status_before: 'RESEARCH', status_after: 'RESEARCH', timestamp: '2026-03-20T14:33:00.000Z', elapsed_ms: 850 },
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
    expect(container.textContent).toContain('Research');
    expect(container.textContent).toContain('Classified ticket as data_quality');
    expect(container.textContent).toContain('Queried postgres_payments');
  });

  it('renders state transitions', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(container.textContent).toContain('INTAKE');
    expect(container.textContent).toContain('RESEARCH');
  });

  it('renders elapsed time', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(container.textContent).toContain('1.2s');
    expect(container.textContent).toContain('850ms');
  });

  it('renders trace integrity footer with step count', () => {
    const { container } = render(<AuditTrace steps={SAMPLE_STEPS} />);
    expect(container.textContent).toContain('3 steps recorded');
    expect(container.textContent).toContain('all actions audited');
  });
});
