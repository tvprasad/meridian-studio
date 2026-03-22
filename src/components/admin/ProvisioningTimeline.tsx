// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { Check } from 'lucide-react';
import type { ProvisioningStatus } from '../../api/runtimes';
import { PROVISIONING_STATUS_META, PROVISIONING_PHASES } from '../../data/provisioningStates';

interface ProvisioningTimelineProps {
  currentStatus: ProvisioningStatus;
}

export function ProvisioningTimeline({ currentStatus }: ProvisioningTimelineProps) {
  const currentOrder = PROVISIONING_STATUS_META[currentStatus].order;
  const isFailed = currentStatus === 'FAILED';
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <div className="flex items-center">
      {PROVISIONING_PHASES.map((phase, i) => {
        const meta = PROVISIONING_STATUS_META[phase];
        const isComplete = meta.order < currentOrder;
        const isCurrent = phase === currentStatus;
        const isFailedAt = (isFailed || isCancelled) && !isComplete && !isCurrent;

        return (
          <div key={phase} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                ${isComplete
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isCurrent
                    ? `${meta.dotColor} border-current ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ${meta.dotColor}/30 text-white`
                    : isFailed && isFailedAt
                      ? 'bg-gray-100 dark:bg-gray-800 border-red-300 dark:border-red-600 text-red-400'
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
              <span className={`text-[10px] font-medium text-center leading-tight max-w-[80px] ${
                isCurrent ? meta.color : isComplete ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {meta.label}
              </span>
            </div>

            {i < PROVISIONING_PHASES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${
                isComplete ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
