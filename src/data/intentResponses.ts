// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

export type IntentKey = 'evaluate' | 'build' | 'test-local' | 'explore';
export type TopologyKey = 'cloud' | 'hybrid' | 'on-prem';

export interface IntentOption {
  key: IntentKey;
  label: string;
}

export interface TopologyOption {
  key: TopologyKey;
  label: string;
}

export const INTENT_OPTIONS: IntentOption[] = [
  { key: 'evaluate', label: 'Evaluate retrieval behavior' },
  { key: 'build', label: 'Build a production system' },
  { key: 'test-local', label: 'Test locally (on-prem / private)' },
  { key: 'explore', label: 'Explore capabilities' },
];

export const TOPOLOGY_OPTIONS: TopologyOption[] = [
  { key: 'cloud', label: 'Cloud' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'on-prem', label: 'On-prem' },
];

const RESPONSES: Record<string, string> = {
  'evaluate|cloud':
    'Cloud deployments include managed guardrails, but retrieval thresholds and confidence gating are still configured in Meridian. The Evaluation page logs every decision for review.',
  'evaluate|hybrid':
    'Hybrid environments split retrieval across cloud and on-prem stores. Confidence thresholds apply uniformly — review behavior differences in the Evaluation page.',
  'evaluate|on-prem':
    'In on-prem environments, execution control and retrieval validation become more important since there are no managed guardrails. Tune thresholds before connecting production data.',
  'build|cloud':
    'Cloud deployments rely on Azure managed services for guardrails and scaling. Retrieval thresholds and audit trails are still configured in Meridian — the platform does not manage them automatically.',
  'build|hybrid':
    'Hybrid deployments require consistent governance across cloud and on-prem retrieval. Confidence gating and refusal behavior apply at the Meridian layer, not the infrastructure layer.',
  'build|on-prem':
    'On-prem production systems own their entire retrieval stack. Confidence thresholds, refusal behavior, and audit trails must be configured before going live.',
  'test-local|cloud':
    'Local testing against cloud backends still enforces retrieval thresholds. Use the Settings page to configure provider endpoints and verify behavior before deploying.',
  'test-local|hybrid':
    'Local testing in hybrid mode lets you validate retrieval across both cloud and on-prem stores. Confidence scores and refusal behavior are consistent regardless of the store.',
  'test-local|on-prem':
    'Local and on-prem deployments control their own retrieval stack. Confidence thresholds and refusal behavior should be tuned before connecting any production data.',
  'explore|cloud':
    'Confidence scores, refusal behavior, and retrieval thresholds are all visible in the Query console. The Evaluation page logs every decision for review.',
  'explore|hybrid':
    'Confidence scores, refusal behavior, and retrieval thresholds are all visible in the Query console. The Evaluation page logs every decision for review.',
  'explore|on-prem':
    'Confidence scores, refusal behavior, and retrieval thresholds are all visible in the Query console. The Evaluation page logs every decision for review.',
};

const FALLBACK =
  'Meridian adapts to your deployment topology. Retrieval confidence, refusal behavior, and audit trails are configurable in Settings.';

export function getIntentResponse(intent: IntentKey, topology: TopologyKey): string {
  return RESPONSES[`${intent}|${topology}`] ?? FALLBACK;
}

export interface IntentProbeRecord {
  intent: IntentKey;
  topology: TopologyKey;
  completedAt: string;
}

const STORAGE_KEY = 'meridian-intent-probe';

export function getStoredProbe(): IntentProbeRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IntentProbeRecord) : null;
  } catch {
    return null;
  }
}

export function storeProbeResult(intent: IntentKey, topology: TopologyKey): void {
  const record: IntentProbeRecord = {
    intent,
    topology,
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function markProbeSkipped(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ skipped: true }));
}
