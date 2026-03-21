// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

// ===========================================
// Investigation Types — mirrors ops_copilot/jira/responses.py
// Safe operator-facing DTOs. No raw internal state.
// ===========================================

/** 12-state lifecycle from ADR-0029. */
export type InvestigationStatus =
  // Active states
  | 'INTAKE'
  | 'RESEARCH'
  | 'DATA_ANALYSIS'
  | 'POLICY_EVALUATE'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  // Terminal states
  | 'NO_ACTION_REQUIRED'
  | 'INSUFFICIENT_DATA'
  | 'REJECTED'
  | 'EXPIRED'
  | 'COMPLETED'
  | 'FAILED';

export const TERMINAL_STATES: ReadonlySet<InvestigationStatus> = new Set([
  'NO_ACTION_REQUIRED',
  'INSUFFICIENT_DATA',
  'REJECTED',
  'EXPIRED',
  'COMPLETED',
  'FAILED',
]);

// ── List view DTO (InvestigationSummary) ────────────────────────────

export interface InvestigationSummary {
  trace_id: string;
  jira_key: string;
  jira_url: string;
  status: InvestigationStatus;
  title: string;
  investigation_type: string;
  confidence: number | null;
  created_at: string;
  step_count: number;
  is_terminal: boolean;
}

// ── Detail view DTOs ────────────────────────────────────────────────

export interface FindingSummary {
  id: string;
  source: string;
  summary: string;
  relevance: string;
}

export interface ExecutionPlanSummary {
  plan_id: string;
  action_summary: string;
  blast_radius: string;
  total_steps: number;
  reversible: boolean;
}

export interface StepSummary {
  step_number: number;
  agent_role: string;
  action: string;
  status_before: string;
  status_after: string;
  timestamp: string;
  elapsed_ms: number;
}

export interface InvestigationDetail {
  trace_id: string;
  jira_key: string;
  jira_url: string;
  status: InvestigationStatus;
  title: string;
  description: string;
  investigation_type: string;
  created_at: string;
  is_terminal: boolean;

  // Analysis
  confidence: number | null;
  confidence_rationale: string | null;
  root_cause_hypothesis: string | null;
  severity: string | null;
  gaps: string[];

  // Evidence
  findings: FindingSummary[];
  data_sources_queried: string[];
  data_sources_failed: string[];

  // Policy decision
  action_recommended: boolean | null;
  policy_rationale: string | null;
  execution_plan: ExecutionPlanSummary | null;

  // Approval
  approval_ref: string | null;

  // Execution
  execution_status: string | null;
  execution_verification: string | null;
  rollback_script: string | null;

  // Audit trail
  steps: StepSummary[];
  step_count: number;
}

// ── API response types ──────────────────────────────────────────────

export interface ApproveResponse {
  trace_id: string;
  status: InvestigationStatus;
  approval_ref: string;
}

export interface RejectResponse {
  trace_id: string;
  status: InvestigationStatus;
}

// ── API client ──────────────────────────────────────────────────────

import { api } from './client';

export const investigationApi = {
  /** Investigation list. Backend returns InvestigationSummary[]. */
  list: (status?: InvestigationStatus) =>
    api.get<InvestigationSummary[]>('/ops/investigations', {
      ...(status && { params: { status } }),
    }),

  /** Full investigation detail by trace_id. Backend returns InvestigationDetail. */
  get: (traceId: string) =>
    api.get<InvestigationDetail>(`/ops/investigations/${encodeURIComponent(traceId)}`),

  /** Pending approvals. Backend returns InvestigationSummary[] for AWAITING_APPROVAL. */
  pendingList: () =>
    api.get<InvestigationSummary[]>('/ops/investigations/pending'),

  /** Approve an investigation plan. */
  approve: (traceId: string, approvalRef: string, planId?: string) =>
    api.post<ApproveResponse>('/ops/approve', {
      trace_id: traceId,
      approval_ref: approvalRef,
      ...(planId && { plan_id: planId }),
    }),

  /** Reject an investigation plan with a reason. */
  reject: (traceId: string, reason: string) =>
    api.post<RejectResponse>('/ops/reject', {
      trace_id: traceId,
      reason,
    }),
};
