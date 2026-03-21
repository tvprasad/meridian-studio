// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApprovalPanel } from '../ApprovalPanel';
import type { PolicyDecision } from '../../../api/investigation';

const MOCK_POLICY: PolicyDecision = {
  action_recommended: true,
  rationale: 'Fix ETL filter for legacy merchants',
  execution_plan: {
    plan_id: 'PLAN-OPS-1234-001',
    plan_hash: 'sha256:e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
    action_summary: 'Update ETL filter and re-run batch',
    steps: [
      {
        step_number: 1,
        action: 'Update ETL WHERE clause',
        tool: 'db_write',
        target: 'etl_config.filter_rules',
        parameters: { rule_id: 'merchant_validation' },
        precondition: 'Current filter_rules row exists',
        expected_outcome: '1 row updated',
        rollback_command: 'UPDATE etl_config SET allow_null=false',
      },
    ],
    total_steps: 1,
    blast_radius: 'medium',
    blast_radius_detail: 'Affects ETL filter only',
    reversible: true,
    evidence_refs: ['F-001'],
    estimated_duration_s: 60,
  },
  risk_score: 0.35,
  policy_violations: [],
  requires_approval_from: ['data-engineering-lead'],
};

describe('ApprovalPanel', () => {
  it('renders governance warning banner', () => {
    const { container } = render(
      <ApprovalPanel policyDecision={MOCK_POLICY} traceId="OPS-1234" onApprove={vi.fn()} onReject={vi.fn()} />,
    );
    expect(container.textContent).toContain('Execution requires explicit approval');
    expect(container.textContent).toContain('This action cannot proceed without approval');
  });

  it('renders plan summary, plan ID, blast radius, and rollback', () => {
    const { container } = render(
      <ApprovalPanel policyDecision={MOCK_POLICY} traceId="OPS-1234" onApprove={vi.fn()} onReject={vi.fn()} />,
    );
    expect(container.textContent).toContain('Update ETL filter and re-run batch');
    expect(container.textContent).toContain('PLAN-OPS-1234-001');
    expect(container.textContent).toContain('MEDIUM');
    expect(container.textContent).toContain('Update ETL WHERE clause');
    expect(container.textContent).toContain('UPDATE etl_config SET allow_null=false');
  });

  it('renders risk score and plan hash', () => {
    const { container } = render(
      <ApprovalPanel policyDecision={MOCK_POLICY} traceId="OPS-1234" onApprove={vi.fn()} onReject={vi.fn()} />,
    );
    expect(container.textContent).toContain('Risk score: 35%');
    expect(container.textContent).toContain('Plan hash: sha256:e4f5a');
  });

  it('renders Approve and Reject buttons', () => {
    render(
      <ApprovalPanel policyDecision={MOCK_POLICY} traceId="OPS-1234" onApprove={vi.fn()} onReject={vi.fn()} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.some((b) => b.textContent?.includes('Approve'))).toBe(true);
    expect(buttons.some((b) => b.textContent?.includes('Reject'))).toBe(true);
  });

  it('transitions to approve mode and calls onApprove on confirm', () => {
    const onApprove = vi.fn();
    const { container } = render(
      <ApprovalPanel policyDecision={MOCK_POLICY} traceId="OPS-1234" onApprove={onApprove} onReject={vi.fn()} />,
    );
    // The Approve/Reject buttons are the action buttons at the bottom
    // Find them by looking for buttons whose textContent matches
    const allButtons = Array.from(container.querySelectorAll('button'));
    const approveBtn = allButtons.find((b) => b.textContent?.includes('Approve'));
    expect(approveBtn).toBeDefined();
    // Use fireEvent.click for React state updates
    fireEvent.click(approveBtn!);
    // After clicking, confirm dialog should appear
    expect(container.textContent).toContain('Confirm approval for plan');
    // Click Confirm Approval
    const confirmBtns = Array.from(container.querySelectorAll('button'));
    const confirmBtn = confirmBtns.find((b) => b.textContent?.includes('Confirm Approval'));
    confirmBtn!.click();
    expect(onApprove).toHaveBeenCalledWith(expect.stringContaining('studio-OPS-1234-'), 'PLAN-OPS-1234-001');
  });

  it('transitions to reject mode, requires reason, and calls onReject', () => {
    const onReject = vi.fn();
    const { container } = render(
      <ApprovalPanel policyDecision={MOCK_POLICY} traceId="OPS-1234" onApprove={vi.fn()} onReject={onReject} />,
    );
    const allButtons = Array.from(container.querySelectorAll('button'));
    const rejectBtn = allButtons.find((b) => b.textContent?.includes('Reject'));
    expect(rejectBtn).toBeDefined();
    fireEvent.click(rejectBtn!);
    expect(container.textContent).toContain('Reject execution plan?');
    // Fill reason and confirm
    const textarea = container.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Needs review' } });
    const confirmBtns = Array.from(container.querySelectorAll('button'));
    const confirmBtn = confirmBtns.find((b) => b.textContent?.includes('Confirm Rejection'));
    fireEvent.click(confirmBtn!);
    expect(onReject).toHaveBeenCalledWith('Needs review');
  });

  it('cancel returns to idle from approve mode', () => {
    const { container } = render(
      <ApprovalPanel policyDecision={MOCK_POLICY} traceId="OPS-1234" onApprove={vi.fn()} onReject={vi.fn()} />,
    );
    const allButtons = Array.from(container.querySelectorAll('button'));
    const approveBtn = allButtons.find((b) => b.textContent?.includes('Approve'));
    fireEvent.click(approveBtn!);
    // Cancel should exist now
    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Cancel'));
    fireEvent.click(cancelBtn!);
    // Back to idle
    expect(container.textContent).toContain('Approve');
  });

  it('renders policy violations when present', () => {
    const withViolations = { ...MOCK_POLICY, policy_violations: ['Exceeds max rows'] };
    const { container } = render(
      <ApprovalPanel policyDecision={withViolations} traceId="OPS-1234" onApprove={vi.fn()} onReject={vi.fn()} />,
    );
    expect(container.textContent).toContain('Policy Violations');
    expect(container.textContent).toContain('Exceeds max rows');
  });

  it('returns null when no execution plan', () => {
    const noplan = { ...MOCK_POLICY, execution_plan: null };
    const { container } = render(
      <ApprovalPanel policyDecision={noplan} traceId="OPS-1234" onApprove={vi.fn()} onReject={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('disables buttons when isSubmitting', () => {
    const { container } = render(
      <ApprovalPanel policyDecision={MOCK_POLICY} traceId="OPS-1234" onApprove={vi.fn()} onReject={vi.fn()} isSubmitting />,
    );
    const allButtons = Array.from(container.querySelectorAll('button'));
    const approveBtn = allButtons.find((b) => b.textContent?.trim() === 'Approve');
    const rejectBtn = allButtons.find((b) => b.textContent?.trim() === 'Reject');
    expect(approveBtn).toBeDisabled();
    expect(rejectBtn).toBeDisabled();
  });
});
