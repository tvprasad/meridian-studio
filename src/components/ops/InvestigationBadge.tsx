// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import type { InvestigationStatus } from '../../api/investigation';
import { STATUS_META } from '../../data/investigationStates';

interface InvestigationBadgeProps {
  status: InvestigationStatus;
  pulse?: boolean;
}

export function InvestigationBadge({ status, pulse }: InvestigationBadgeProps) {
  const meta = STATUS_META[status];
  const shouldPulse = pulse ?? status === 'AWAITING_APPROVAL';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${meta.bgColor} ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor} ${shouldPulse ? 'animate-pulse' : ''}`} />
      {meta.label}
    </span>
  );
}
