// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useCallback, useState, type ReactNode } from 'react';
import {
  DiagnosticsContext,
  initial,
  PRICING,
  type CallRecord,
  type DiagnosticsState,
} from './DiagnosticsContext';

export { type CallRecord } from './DiagnosticsContext';

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
