// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import type { InvestigationStatus } from '../api/investigation';

// ── Status metadata ─────────────────────────────────────────────────

export interface StatusMeta {
  label: string;
  shortLabel: string;
  group: 'research' | 'approval' | 'execution' | 'terminal';
  color: string;       // Tailwind text color
  bgColor: string;     // Tailwind bg for badge
  dotColor: string;    // Tailwind bg for status dot
  order: number;       // Timeline position (0-indexed)
}

export const STATUS_META: Record<InvestigationStatus, StatusMeta> = {
  INTAKE: {
    label: 'Intake',
    shortLabel: 'Intake',
    group: 'research',
    color: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-900/20',
    dotColor: 'bg-sky-500',
    order: 0,
  },
  RESEARCH: {
    label: 'Research',
    shortLabel: 'Research',
    group: 'research',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    dotColor: 'bg-blue-500',
    order: 1,
  },
  DATA_ANALYSIS: {
    label: 'Data Analysis',
    shortLabel: 'Analysis',
    group: 'research',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    dotColor: 'bg-violet-500',
    order: 2,
  },
  POLICY_EVALUATE: {
    label: 'Policy Evaluation',
    shortLabel: 'Policy',
    group: 'research',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    dotColor: 'bg-amber-500',
    order: 3,
  },
  AWAITING_APPROVAL: {
    label: 'Awaiting Approval',
    shortLabel: 'Pending',
    group: 'approval',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    dotColor: 'bg-amber-500',
    order: 4,
  },
  APPROVED: {
    label: 'Approved',
    shortLabel: 'Approved',
    group: 'execution',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    dotColor: 'bg-emerald-500',
    order: 5,
  },
  EXECUTING: {
    label: 'Executing',
    shortLabel: 'Executing',
    group: 'execution',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    dotColor: 'bg-violet-500',
    order: 6,
  },
  COMPLETED: {
    label: 'Completed',
    shortLabel: 'Done',
    group: 'terminal',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    dotColor: 'bg-emerald-500',
    order: 7,
  },
  NO_ACTION_REQUIRED: {
    label: 'No Action Required',
    shortLabel: 'No Action',
    group: 'terminal',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    order: 7,
  },
  INSUFFICIENT_DATA: {
    label: 'Insufficient Data',
    shortLabel: 'Insufficient',
    group: 'terminal',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    dotColor: 'bg-orange-500',
    order: 7,
  },
  REJECTED: {
    label: 'Rejected',
    shortLabel: 'Rejected',
    group: 'terminal',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    dotColor: 'bg-red-500',
    order: 7,
  },
  EXPIRED: {
    label: 'Expired',
    shortLabel: 'Expired',
    group: 'terminal',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    order: 7,
  },
  FAILED: {
    label: 'Failed',
    shortLabel: 'Failed',
    group: 'terminal',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    dotColor: 'bg-red-500',
    order: 7,
  },
};

/** Happy-path states for the workflow timeline visualization. */
export const TIMELINE_STATES: InvestigationStatus[] = [
  'INTAKE',
  'RESEARCH',
  'DATA_ANALYSIS',
  'POLICY_EVALUATE',
  'AWAITING_APPROVAL',
  'APPROVED',
  'EXECUTING',
  'COMPLETED',
];

/** The index in TIMELINE_STATES where the approval gate sits. */
export const APPROVAL_GATE_INDEX = 4;

/** Agent role display config. */
export const AGENT_ROLE_META: Record<string, { label: string; color: string; bgColor: string }> = {
  intake: { label: 'Intake', color: 'text-sky-700 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-900/20' },
  research: { label: 'Research', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  analysis: { label: 'Analysis', color: 'text-violet-700 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-900/20' },
  policy: { label: 'Policy', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  execution: { label: 'Execution', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  machine: { label: 'System', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  system: { label: 'System', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800' },
};

/** Filter group definitions for the investigation list. */
export const STATUS_GROUPS = {
  active: ['INTAKE', 'RESEARCH', 'DATA_ANALYSIS', 'POLICY_EVALUATE', 'APPROVED', 'EXECUTING'] as InvestigationStatus[],
  awaiting: ['AWAITING_APPROVAL'] as InvestigationStatus[],
  terminal: ['COMPLETED', 'NO_ACTION_REQUIRED', 'INSUFFICIENT_DATA', 'REJECTED', 'EXPIRED', 'FAILED'] as InvestigationStatus[],
};
