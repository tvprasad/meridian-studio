// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { createContext } from 'react';

// ── Azure pricing estimates (per-unit, USD) ─────────────────────────────────
export const PRICING: Record<string, number> = {
  Language:  0.001,   // ~$1 per 1,000 text records
  Vision:    0.001,   // ~$1 per 1,000 images
  'Speech:STT': 0.0167, // ~$1 per 60 min → $0.0167/min (est. per call)
  'Speech:TTS': 0.000016, // ~$16 per 1M chars → $0.000016/char (est. per call)
  DocIntel:  0.001,   // ~$1 per 1,000 pages (Read model)
};

export interface CallRecord {
  service: string;
  operation: string;
  status: number | 'ok' | 'error';
  latencyMs: number;
  requestId?: string;
  timestamp: number;
  estimatedCost: number;
}

export interface DiagnosticsState {
  lastCall: CallRecord | null;
  calls: CallRecord[];
  totalCalls: number;
  totalCost: number;
  callsByService: Record<string, { count: number; cost: number }>;
}

export interface DiagnosticsContextValue extends DiagnosticsState {
  recordCall: (call: Omit<CallRecord, 'timestamp' | 'estimatedCost'> & { estimatedCost?: number }) => void;
  reset: () => void;
}

export const initial: DiagnosticsState = {
  lastCall: null,
  calls: [],
  totalCalls: 0,
  totalCost: 0,
  callsByService: {},
};

export const DiagnosticsContext = createContext<DiagnosticsContextValue | null>(null);
