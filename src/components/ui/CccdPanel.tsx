// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { RefreshCw } from 'lucide-react';
import { Card } from './Card';

interface CccdPanelProps {
  calibrationEnabled?: boolean;
}

/**
 * Read-only panel surfacing the CCCD framework status on the Dashboard.
 * CCCD (Continuous Calibration, Continuous Development) is Meridian's
 * feedback loop that keeps confidence scoring accurate as the knowledge
 * base evolves.
 */
export function CccdPanel({ calibrationEnabled }: CccdPanelProps) {
  return (
    <Card className="border-l-4 border-l-blue-400 group mt-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 shrink-0">
          <RefreshCw className="w-5 h-5 text-blue-600 group-hover:rotate-180 transition-transform duration-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            CCCD — Continuous Calibration, Continuous Development
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Confidence scoring recalibrates as the knowledge base evolves, keeping retrieval accuracy aligned with ground truth over time.
          </p>
          <div className="mt-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">Calibration</span>
            <span
              className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                calibrationEnabled
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-gray-500/15 text-gray-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  calibrationEnabled ? 'bg-green-400' : 'bg-gray-400'
                }`}
              />
              {calibrationEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
