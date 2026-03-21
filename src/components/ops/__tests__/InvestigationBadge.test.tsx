// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvestigationBadge } from '../InvestigationBadge';

describe('InvestigationBadge', () => {
  it('renders the label for a given status', () => {
    render(<InvestigationBadge status="COMPLETED" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders the label for AWAITING_APPROVAL', () => {
    render(<InvestigationBadge status="AWAITING_APPROVAL" />);
    expect(screen.getByText('Awaiting Approval')).toBeInTheDocument();
  });

  it('applies pulse animation for AWAITING_APPROVAL by default', () => {
    const { container } = render(<InvestigationBadge status="AWAITING_APPROVAL" />);
    const dot = container.querySelector('.animate-pulse');
    expect(dot).toBeInTheDocument();
  });

  it('does not pulse for COMPLETED by default', () => {
    const { container } = render(<InvestigationBadge status="COMPLETED" />);
    const dot = container.querySelector('.animate-pulse');
    expect(dot).toBeNull();
  });

  it('renders all terminal states correctly', () => {
    const terminalStates = ['COMPLETED', 'FAILED', 'REJECTED', 'EXPIRED', 'NO_ACTION_REQUIRED', 'INSUFFICIENT_DATA'] as const;
    const expectedLabels = ['Completed', 'Failed', 'Rejected', 'Expired', 'No Action Required', 'Insufficient Data'];

    terminalStates.forEach((status, i) => {
      const { unmount, container } = render(<InvestigationBadge status={status} />);
      expect(container.textContent).toContain(expectedLabels[i]);
      unmount();
    });
  });

  it('renders all active states correctly', () => {
    const activeStates = ['INTAKE', 'RESEARCH', 'DATA_ANALYSIS', 'POLICY_EVALUATE', 'APPROVED', 'EXECUTING'] as const;
    const expectedLabels = ['Intake', 'Research', 'Data Analysis', 'Policy Evaluation', 'Approved', 'Executing'];

    activeStates.forEach((status, i) => {
      const { unmount } = render(<InvestigationBadge status={status} />);
      expect(screen.getByText(expectedLabels[i])).toBeInTheDocument();
      unmount();
    });
  });

  it('respects explicit pulse override', () => {
    const { container } = render(<InvestigationBadge status="COMPLETED" pulse={true} />);
    const dot = container.querySelector('.animate-pulse');
    expect(dot).toBeInTheDocument();
  });
});
