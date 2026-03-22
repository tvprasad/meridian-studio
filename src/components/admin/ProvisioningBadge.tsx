// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import type { ProvisioningStatus } from '../../api/runtimes';
import { PROVISIONING_STATUS_META } from '../../data/provisioningStates';

interface ProvisioningBadgeProps {
  status: ProvisioningStatus;
}

export function ProvisioningBadge({ status }: ProvisioningBadgeProps) {
  const meta = PROVISIONING_STATUS_META[status];
  const isActive = !['READY', 'FAILED', 'CANCELLED'].includes(status);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${meta.bgColor} ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor} ${isActive ? 'animate-pulse' : ''}`} />
      {meta.label}
    </span>
  );
}
