// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

// ===========================================
// Investigation Types (mirrors ops_copilot/state.py)
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

// ── Agent output types ──────────────────────────────────────────────

export interface InvestigationPlan {
  investigation_type: string;
  scope: string;
  data_sources: string[];
  questions: string[];
  priority: 'critical' | 'high' | 'normal' | 'low';
  estimated_tools: string[];
}

export interface Finding {
  id: string;
  source: string;
  tool_used: string;
  query: string;
  timestamp: string;
  raw_result_hash: string;
  summary: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface EvidenceCollection {
  findings: Finding[];
  data_sources_queried: string[];
  data_sources_failed: string[];
  total_queries: number;
  collection_time_ms: number;
}

export interface Analysis {
  summary: string;
  root_cause_hypothesis: string;
  confidence: number;
  confidence_rationale: string;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  gaps: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_systems: string[];
  time_range: string;
}

export interface ExecutionStep {
  step_number: number;
  action: string;
  tool: string;
  target: string;
  parameters: Record<string, unknown>;
  precondition: string;
  expected_outcome: string;
  rollback_command: string;
}

export interface ExecutionPlan {
  plan_id: string;
  plan_hash: string;
  action_summary: string;
  steps: ExecutionStep[];
  total_steps: number;
  blast_radius: 'low' | 'medium' | 'high' | 'critical';
  blast_radius_detail: string;
  reversible: boolean;
  evidence_refs: string[];
  estimated_duration_s: number;
}

export interface PolicyDecision {
  action_recommended: boolean;
  rationale: string;
  execution_plan: ExecutionPlan | null;
  risk_score: number;
  policy_violations: string[];
  requires_approval_from: string[];
}

export interface ExecutionResult {
  step_number: number;
  status: 'success' | 'failed' | 'precondition_failed';
  tool_used: string;
  tool_input: Record<string, unknown>;
  tool_output: string;
  tool_output_hash: string;
  verification: string;
  verification_passed: boolean;
  rollback_script: string;
  elapsed_ms: number;
}

/** Audit trail entry (ADR-0030). */
export interface StepRecord {
  trace_id: string;
  step_number: number;
  agent_role: string;
  action: string;
  status_before: string;
  status_after: string;
  tool_name: string | null;
  tool_input_hash: string | null;
  tool_output_hash: string | null;
  approval_ref: string | null;
  plan_id: string | null;
  timestamp: string;
  elapsed_ms: number;
}

// ── Investigation state ─────────────────────────────────────────────

export interface InvestigationState {
  trace_id: string;
  jira_key: string;
  jira_url: string;
  created_at: string;
  status: InvestigationStatus;
  retry_count: number;
  version: number;
  ticket_summary: string;
  ticket_description: string;
  investigation_type: string;
  investigation_plan: InvestigationPlan | null;
  evidence: EvidenceCollection | null;
  analysis: Analysis | null;
  policy_decision: PolicyDecision | null;
  approval_ref: string | null;
  execution_result: ExecutionResult | null;
  step_log: StepRecord[];
}

// ── API response shapes ─────────────────────────────────────────────

export interface InvestigationListItem {
  trace_id: string;
  jira_key: string;
  jira_url: string;
  status: InvestigationStatus;
  investigation_type: string;
  created_at: string;
  updated_at: string;
  step_count: number;
}

/** Backend returns a bare array. Frontend wraps for convenience. */
export type InvestigationListResponse = InvestigationListItem[];

/** Backend returns an array of trace_ids for AWAITING_APPROVAL. */
export type PendingTraceIds = string[];

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
  /** Investigation list with optional status filter. Backend returns a bare array. */
  list: (status?: InvestigationStatus) =>
    api.get<InvestigationListResponse>('/ops/investigations', {
      ...(status && { params: { status } }),
    }),

  /** Full investigation state by trace_id. */
  get: (traceId: string) =>
    api.get<InvestigationState>(`/ops/investigations/${encodeURIComponent(traceId)}`),

  /** Trace IDs of investigations in AWAITING_APPROVAL. */
  pendingTraceIds: () =>
    api.get<PendingTraceIds>('/ops/investigations/pending'),

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
