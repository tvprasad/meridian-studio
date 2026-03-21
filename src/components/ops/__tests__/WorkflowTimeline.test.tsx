// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowTimeline } from '../WorkflowTimeline';

describe('WorkflowTimeline', () => {
  it('renders all timeline state labels', () => {
    render(<WorkflowTimeline currentStatus="INTAKE" />);
    // Desktop labels use shortLabel
    expect(screen.getAllByText('Intake').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Research').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Analysis').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Policy').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the Approval Gate divider', () => {
    render(<WorkflowTimeline currentStatus="RESEARCH" />);
    // Desktop uses "Approval Gate", mobile uses "No execution without approval"
    expect(screen.getAllByText('Approval Gate').length).toBeGreaterThanOrEqual(1);
  });

  it('renders mobile governance text', () => {
    render(<WorkflowTimeline currentStatus="AWAITING_APPROVAL" />);
    expect(screen.getAllByText('No execution without approval').length).toBeGreaterThanOrEqual(1);
  });

  it('shows completed checkmarks for past states', () => {
    const { container } = render(<WorkflowTimeline currentStatus="DATA_ANALYSIS" />);
    // INTAKE and RESEARCH should be completed (order 0, 1 < order 2)
    // Check for emerald-500 bg on completed nodes
    const completedNodes = container.querySelectorAll('.bg-emerald-500');
    expect(completedNodes.length).toBeGreaterThanOrEqual(2);
  });

  it('highlights current state with ring', () => {
    const { container } = render(<WorkflowTimeline currentStatus="RESEARCH" />);
    // Current state node has ring-4 class
    const currentNode = container.querySelector('.ring-4');
    expect(currentNode).toBeInTheDocument();
  });

  it('renders for terminal states', () => {
    render(<WorkflowTimeline currentStatus="COMPLETED" />);
    // All happy-path states should show as completed
    expect(screen.getAllByText('Done').length).toBeGreaterThanOrEqual(1);
  });
});
