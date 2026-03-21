// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ApprovalPanel } from '../ApprovalPanel';
import type { ExecutionPlanSummary } from '../../../api/investigation';

const MOCK_PLAN: ExecutionPlanSummary = {
  plan_id: 'PLAN-OPS-1234-001',
  action_summary: 'Update ETL filter and re-run batch',
  blast_radius: 'medium',
  total_steps: 2,
  reversible: true,
};

function renderPanel(overrides?: { isSubmitting?: boolean }) {
  return render(
    <ApprovalPanel
      executionPlan={MOCK_PLAN}
      policyRationale="Fix ETL filter for legacy merchants"
      traceId="OPS-1234"
      onApprove={vi.fn()}
      onReject={vi.fn()}
      isSubmitting={overrides?.isSubmitting}
    />,
  );
}

describe('ApprovalPanel', () => {
  it('renders governance warning banner', () => {
    const { container } = renderPanel();
    expect(container.textContent).toContain('Execution requires explicit approval');
    expect(container.textContent).toContain('This action cannot proceed without approval');
  });

  it('renders plan summary, plan ID, blast radius', () => {
    const { container } = renderPanel();
    expect(container.textContent).toContain('Update ETL filter and re-run batch');
    expect(container.textContent).toContain('PLAN-OPS-1234-001');
    expect(container.textContent).toContain('MEDIUM');
  });

  it('renders policy rationale', () => {
    const { container } = renderPanel();
    expect(container.textContent).toContain('Fix ETL filter for legacy merchants');
  });

  it('renders Approve and Reject buttons', () => {
    const { container } = renderPanel();
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.some((b) => b.textContent?.includes('Approve'))).toBe(true);
    expect(buttons.some((b) => b.textContent?.includes('Reject'))).toBe(true);
  });

  it('transitions to approve mode and calls onApprove on confirm', () => {
    const onApprove = vi.fn();
    const { container } = render(
      <ApprovalPanel executionPlan={MOCK_PLAN} policyRationale={null} traceId="OPS-1234" onApprove={onApprove} onReject={vi.fn()} />,
    );
    const approveBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Approve'));
    fireEvent.click(approveBtn!);
    expect(container.textContent).toContain('Confirm approval for plan');
    expect(container.textContent).toContain('All execution goes through Tool Gateway');
    const confirmBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Confirm Approval'));
    fireEvent.click(confirmBtn!);
    expect(onApprove).toHaveBeenCalledWith(expect.stringContaining('studio-OPS-1234-'), 'PLAN-OPS-1234-001');
  });

  it('transitions to reject mode, requires reason, and calls onReject', () => {
    const onReject = vi.fn();
    const { container } = render(
      <ApprovalPanel executionPlan={MOCK_PLAN} policyRationale={null} traceId="OPS-1234" onApprove={vi.fn()} onReject={onReject} />,
    );
    const rejectBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reject'));
    fireEvent.click(rejectBtn!);
    expect(container.textContent).toContain('Reject execution plan?');
    fireEvent.change(container.querySelector('textarea')!, { target: { value: 'Needs review' } });
    const confirmBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Confirm Rejection'));
    fireEvent.click(confirmBtn!);
    expect(onReject).toHaveBeenCalledWith('Needs review');
  });

  it('cancel returns to idle from approve mode', () => {
    const { container } = renderPanel();
    const approveBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Approve'));
    fireEvent.click(approveBtn!);
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Cancel'));
    fireEvent.click(cancelBtn!);
    expect(container.textContent).toContain('Approve');
  });

  it('disables buttons when isSubmitting', () => {
    const { container } = renderPanel({ isSubmitting: true });
    const approveBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Approve'));
    const rejectBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Reject'));
    expect(approveBtn).toBeDisabled();
    expect(rejectBtn).toBeDisabled();
  });
});
