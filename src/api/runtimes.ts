// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

// ===========================================
// Runtime Provisioning Types — mirrors runtime_provisioning/router.py DTOs
// Platform-admin only. No AWS credentials exposed.
// ===========================================

/** 8-state provisioning lifecycle from runtime_provisioning/state.py. */
export type ProvisioningStatus =
  | 'QUEUED'
  | 'PROVISIONING_CLUSTER'
  | 'INSTALLING_CONTROLLERS'
  | 'INSTALLING_RUNTIME'
  | 'DEPLOYING_MERIDIAN'
  | 'READY'
  | 'FAILED'
  | 'CANCELLED';

export const PROVISIONING_TERMINAL: ReadonlySet<ProvisioningStatus> = new Set([
  'READY', 'FAILED', 'CANCELLED',
]);

export interface RuntimeSummary {
  id: string;
  name: string;
  cloud: string;
  region: string;
  status: ProvisioningStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  current_step: string;
  error: string | null;
}

export interface ProvisioningStepEntry {
  step_number: number;
  action: string;
  status: string;
  timestamp: string;
  elapsed_ms: number;
  error: string | null;
}

export interface RuntimeDetail extends RuntimeSummary {
  config: Record<string, unknown>;
  version: number;
  step_count: number;
  steps: ProvisioningStepEntry[];
}

export interface CreateRuntimeRequest {
  name: string;
  cloud: 'aws' | 'azure' | 'gcp';
  region: string;
  config?: Record<string, unknown>;
}

// ── API client ──────────────────────────────────────────────────────

import { api } from './client';

export const runtimesApi = {
  /** List all runtime environments (admin only). */
  list: () =>
    api.get<RuntimeSummary[]>('/admin/runtimes'),

  /** Get runtime detail by ID. */
  get: (id: string) =>
    api.get<RuntimeDetail>(`/admin/runtimes/${encodeURIComponent(id)}`),

  /** Create a new runtime environment. */
  create: (body: CreateRuntimeRequest) =>
    api.post<RuntimeSummary>('/admin/runtimes', body),

  /** Start provisioning an existing runtime. */
  provision: (id: string) =>
    api.post<RuntimeSummary>(`/admin/runtimes/${encodeURIComponent(id)}/provision`, {}),

  /** Cancel provisioning. */
  cancel: (id: string) =>
    api.post<RuntimeSummary>(`/admin/runtimes/${encodeURIComponent(id)}/cancel`, {}),
};
