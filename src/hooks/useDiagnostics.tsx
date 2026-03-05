import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';

// ── Azure pricing estimates (per-unit, USD) ─────────────────────────────────
const PRICING: Record<string, number> = {
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

interface DiagnosticsState {
  lastCall: CallRecord | null;
  calls: CallRecord[];
  totalCalls: number;
  totalCost: number;
  callsByService: Record<string, { count: number; cost: number }>;
}

interface DiagnosticsContextValue extends DiagnosticsState {
  recordCall: (call: Omit<CallRecord, 'timestamp' | 'estimatedCost'> & { estimatedCost?: number }) => void;
  reset: () => void;
}

const initial: DiagnosticsState = {
  lastCall: null,
  calls: [],
  totalCalls: 0,
  totalCost: 0,
  callsByService: {},
};

const DiagnosticsContext = createContext<DiagnosticsContextValue | null>(null);

export function DiagnosticsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DiagnosticsState>(initial);

  const recordCall = useCallback(
    (input: Omit<CallRecord, 'timestamp' | 'estimatedCost'> & { estimatedCost?: number }) => {
      const cost = input.estimatedCost ?? PRICING[input.service] ?? 0;
      const record: CallRecord = { ...input, timestamp: Date.now(), estimatedCost: cost };

      setState((prev) => {
        const svc = prev.callsByService[record.service] ?? { count: 0, cost: 0 };
        return {
          lastCall: record,
          calls: [...prev.calls, record],
          totalCalls: prev.totalCalls + 1,
          totalCost: prev.totalCost + record.estimatedCost,
          callsByService: {
            ...prev.callsByService,
            [record.service]: {
              count: svc.count + 1,
              cost: svc.cost + record.estimatedCost,
            },
          },
        };
      });
    },
    [],
  );

  const reset = useCallback(() => setState(initial), []);

  return (
    <DiagnosticsContext.Provider value={{ ...state, recordCall, reset }}>
      {children}
    </DiagnosticsContext.Provider>
  );
}

export function useDiagnostics() {
  const ctx = useContext(DiagnosticsContext);
  if (!ctx) throw new Error('useDiagnostics must be used within DiagnosticsProvider');
  return ctx;
}
