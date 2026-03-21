// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useQuery } from '@tanstack/react-query';
import { investigationApi } from '../../api/investigation';

export function PendingBadge() {
  const { data } = useQuery({
    queryKey: ['investigations', 'pending-ids'],
    queryFn: investigationApi.pendingTraceIds,
    refetchInterval: 30_000,
  });

  const count = data?.length ?? 0;
  if (!count) return null;

  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-amber-500 text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
