// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { Check, Shield, Lock } from 'lucide-react';
import type { InvestigationStatus } from '../../api/investigation';
import { STATUS_META, TIMELINE_STATES, APPROVAL_GATE_INDEX } from '../../data/investigationStates';

interface WorkflowTimelineProps {
  currentStatus: InvestigationStatus;
}

export function WorkflowTimeline({ currentStatus }: WorkflowTimelineProps) {
  const currentMeta = STATUS_META[currentStatus];
  const currentOrder = currentMeta.order;

  return (
    <div className="w-full">
      {/* Desktop: horizontal timeline */}
      <div className="hidden md:block">
        <div className="flex items-center">
          {TIMELINE_STATES.map((status, i) => {
            const meta = STATUS_META[status];
            const isComplete = meta.order < currentOrder;
            const isCurrent = status === currentStatus;
            const isFuture = meta.order > currentOrder;
            const isApprovalGate = i === APPROVAL_GATE_INDEX;

            return (
              <div key={status} className="flex items-center flex-1 last:flex-none">
                {/* Approval gate divider */}
                {isApprovalGate && (
                  <div className="flex flex-col items-center mx-1 shrink-0">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
                      <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Approval Gate
                      </span>
                    </div>
                  </div>
                )}

                {/* Node */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                    ${isComplete
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isCurrent
                        ? `${meta.dotColor} border-current ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ${meta.dotColor}/30 text-white`
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                    }
                  `}>
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-current opacity-40" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight max-w-[70px] ${
                    isCurrent ? meta.color : isFuture ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {meta.shortLabel}
                  </span>
                </div>

                {/* Connector line */}
                {i < TIMELINE_STATES.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${
                    isComplete ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical compact */}
      <div className="md:hidden space-y-1">
        {TIMELINE_STATES.map((status, i) => {
          const meta = STATUS_META[status];
          const isComplete = meta.order < currentOrder;
          const isCurrent = status === currentStatus;
          const isApprovalGate = i === APPROVAL_GATE_INDEX;

          return (
            <div key={status}>
              {isApprovalGate && (
                <div className="flex items-center gap-2 py-1 pl-4">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    No execution without approval
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isComplete ? 'bg-emerald-500' : isCurrent ? meta.dotColor : 'bg-gray-300 dark:bg-gray-600'
                }`} />
                <span className={`text-xs ${
                  isCurrent ? `font-semibold ${meta.color}` : isComplete ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'
                }`}>
                  {meta.label}
                </span>
                {isComplete && <Check className="w-3 h-3 text-emerald-500" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
