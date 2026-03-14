// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState } from 'react';
import { useDiagnostics } from '../../hooks/useDiagnosticsHook';
import { ChevronRight, ChevronDown, Activity, BarChart3, RotateCcw } from 'lucide-react';

function formatCost(cost: number): string {
  if (cost < 0.0001) return '$0.0000';
  return `$${cost.toFixed(4)}`;
}

function StatusDot({ status }: { status: number | 'ok' | 'error' }) {
  const isOk = status === 'ok' || (typeof status === 'number' && status >= 200 && status < 300);
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${isOk ? 'bg-emerald-400' : 'bg-red-400'}`}
      title={String(status)}
    />
  );
}

export function DiagnosticsPanel() {
  const { lastCall, totalCalls, totalCost, callsByService, reset } = useDiagnostics();
  const [diagOpen, setDiagOpen] = useState(true);
  const [govOpen, setGovOpen] = useState(true);

  if (totalCalls === 0 && !lastCall) return null;

  return (
    <aside className="w-64 border-l border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] shrink-0 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* ── Diagnostics ────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setDiagOpen(!diagOpen)}
            className="flex items-center gap-2 w-full text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {diagOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Activity className="w-3 h-3" />
            Diagnostics
          </button>

          {diagOpen && lastCall && (
            <div className="mt-3 space-y-2.5 text-sm">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Last Call</p>
                <p className="text-gray-700 dark:text-gray-200 font-medium">{lastCall.service}:{lastCall.operation}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Status</p>
                <StatusDot status={lastCall.status} />
                <span className="text-gray-700 dark:text-gray-200">{typeof lastCall.status === 'number' ? lastCall.status : lastCall.status === 'ok' ? '200' : 'Error'}</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Latency</p>
                <p className="text-gray-700 dark:text-gray-200">{lastCall.latencyMs} ms</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Est. Cost</p>
                <p className="text-gray-700 dark:text-gray-200">{formatCost(lastCall.estimatedCost)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Calls</p>
                <p className="text-gray-700 dark:text-gray-200">{totalCalls}</p>
              </div>
              {lastCall.requestId && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Request ID</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-mono break-all leading-relaxed">{lastCall.requestId}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <hr className="border-gray-200 dark:border-white/10" />

        {/* ── Governance ─────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setGovOpen(!govOpen)}
            className="flex items-center gap-2 w-full text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {govOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <BarChart3 className="w-3 h-3" />
            Governance
          </button>

          {govOpen && (
            <div className="mt-3 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Calls</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCalls}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Session Cost</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCost(totalCost)}</p>
                </div>
              </div>

              {Object.keys(callsByService).length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Usage by Service</p>
                  <div className="space-y-1">
                    {Object.entries(callsByService).map(([svc, { count, cost }]) => (
                      <div key={svc} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{svc}</span>
                        <span className="text-gray-400 dark:text-gray-500">{count} calls — {formatCost(cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-400 leading-relaxed">
                Estimates based on Azure retail pricing (2026-Q1). Not actual billing data.
              </p>

              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset session
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
