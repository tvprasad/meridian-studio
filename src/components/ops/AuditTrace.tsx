// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { Shield, Wrench, Clock, ArrowRight } from 'lucide-react';
import type { StepRecord } from '../../api/investigation';
import { AGENT_ROLE_META } from '../../data/investigationStates';

interface AuditTraceProps {
  steps: StepRecord[];
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return ts;
  }
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AuditTrace({ steps }: AuditTraceProps) {
  if (!steps.length) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
        No audit steps recorded yet.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-0">
        {steps.map((step, i) => {
          const roleMeta = AGENT_ROLE_META[step.agent_role] ?? AGENT_ROLE_META.system;
          const isTransition = step.status_before !== step.status_after && step.status_after;

          return (
            <div key={`${step.trace_id}-${step.step_number}`} className="relative pl-10 pb-4">
              {/* Step marker */}
              <div className="absolute left-2 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center z-10">
                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{step.step_number}</span>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${roleMeta.bgColor} ${roleMeta.color}`}>
                      {roleMeta.label}
                    </span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">{step.action}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(step.timestamp)}
                    </span>
                    {step.elapsed_ms > 0 && (
                      <span>{formatElapsed(step.elapsed_ms)}</span>
                    )}
                  </div>
                </div>

                {/* State transition */}
                {isTransition && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{step.status_before}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">{step.status_after}</span>
                  </div>
                )}

                {/* Metadata row */}
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  {step.tool_name && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Wrench className="w-3 h-3" />
                      {step.tool_name}
                    </span>
                  )}
                  {step.tool_input_hash && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Shield className="w-3 h-3" />
                      <span className="font-mono">in:{step.tool_input_hash.slice(0, 8)}</span>
                    </span>
                  )}
                  {step.tool_output_hash && (
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                      out:{step.tool_output_hash.slice(0, 8)}
                    </span>
                  )}
                  {step.approval_ref && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Shield className="w-3 h-3" />
                      {step.approval_ref.slice(0, 20)}...
                    </span>
                  )}
                  {step.plan_id && (
                    <span className="text-xs font-mono text-violet-600 dark:text-violet-400">
                      plan:{step.plan_id.slice(0, 12)}
                    </span>
                  )}
                </div>
              </div>

              {/* Governance boundary marker between step 4 (approval) and execution */}
              {i < steps.length - 1
                && step.status_after === 'AWAITING_APPROVAL'
                && steps[i + 1]?.status_before === 'AWAITING_APPROVAL' && (
                <div className="relative pl-0 py-2 ml-[-2rem]">
                  <div className="flex items-center gap-2 pl-10">
                    <div className="flex-1 h-px bg-amber-300 dark:bg-amber-700" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 whitespace-nowrap px-2">
                      No execution without approval
                    </span>
                    <div className="flex-1 h-px bg-amber-300 dark:bg-amber-700" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trace integrity footer */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Shield className="w-3.5 h-3.5" />
        <span>{steps.length} steps recorded — append-only audit trail — all actions audited</span>
      </div>
    </div>
  );
}
