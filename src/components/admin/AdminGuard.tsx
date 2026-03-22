// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { type ReactNode } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/useAuth';
import { Card } from '../ui/Card';
import { adminApi } from '../../api/runtimes';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Role guard for platform-admin pages.
 *
 * Calls GET /admin/whoami to check access server-side.
 * No admin identities stored in the client bundle.
 *
 * When auth is disabled, all users are operators (backend returns is_admin: true).
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { authEnabled, isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'whoami'],
    queryFn: adminApi.whoami,
    enabled: authEnabled && isAuthenticated,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    retry: false,
  });

  // Auth disabled — no RBAC enforcement
  if (!authEnabled) return <>{children}</>;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Network error or 403 — treat as not admin
  if (error || !data?.is_admin) {
    return (
      <Card className="border-l-4 border-l-red-400 max-w-lg mx-auto mt-12">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Access Restricted</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Platform admin pages require the operator role. Contact your administrator.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
