// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { type ReactNode } from 'react';
import { ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/useAuth';
import { Card } from '../ui/Card';
import { adminApi } from '../../api/runtimes';
import { ApiError } from '../../api/client';

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
 *
 * Retry logic handles the race where useIsAuthenticated() becomes true slightly
 * before acquireTokenSilent() has the token ready, causing a token-less first
 * request. retryDelay gives MSAL time to warm the cache before the next attempt.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { authEnabled, isAuthenticated } = useAuth();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'whoami'],
    queryFn: adminApi.whoami,
    enabled: authEnabled && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    // Retry up to 2 times for transient auth failures (token not yet cached).
    // Never retry on explicit 403 — that is a real permission denial.
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 403) return false;
      return failureCount < 2;
    },
    retryDelay: 1500,
  });

  // Auth disabled — no RBAC enforcement
  if (!authEnabled) return <>{children}</>;

  // Loading / retrying
  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Auth/network error — distinct from permission denied.
  // "Missing Bearer token" (401) means a transient token race; let the user retry
  // rather than permanently blocking with "Access Restricted".
  if (error) {
    const isAuthError =
      error instanceof ApiError && (error.status === 401 || error.status === 0);

    if (isAuthError) {
      return (
        <Card className="border-l-4 border-l-amber-400 max-w-lg mx-auto mt-12">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Session not ready
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                The authentication token was not available when the access check
                ran. This can happen immediately after sign-in.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          </div>
        </Card>
      );
    }

    // 403 or other server error → genuine access denied
    return (
      <Card className="border-l-4 border-l-red-400 max-w-lg mx-auto mt-12">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Access Restricted
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Platform admin pages require the operator role. Contact your
              administrator.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Whoami returned is_admin: false
  if (!data?.is_admin) {
    return (
      <Card className="border-l-4 border-l-red-400 max-w-lg mx-auto mt-12">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Access Restricted
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Platform admin pages require the operator role. Contact your
              administrator.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
