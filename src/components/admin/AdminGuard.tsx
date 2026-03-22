// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { type ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Card } from '../ui/Card';
import { config } from '../../config';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Role guard for platform-admin pages.
 *
 * Access is granted when ANY of the following is true:
 * 1. Auth is disabled (local dev — all users are operators)
 * 2. MSAL token contains operator/admin/platform-admin role
 * 3. User's email is in VITE_ADMIN_EMAILS allowlist
 *    (required for personal Microsoft accounts that don't support appRoles)
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { authEnabled, roles, user } = useAuth();

  // Auth disabled — no RBAC enforcement
  if (!authEnabled) return <>{children}</>;

  // Check role claim (works with work/school accounts)
  const hasRole = roles.includes('operator') || roles.includes('admin') || roles.includes('platform-admin');

  // Check email allowlist (works with personal accounts)
  const userEmail = (user?.username ?? '').toLowerCase();
  const inAllowlist = config.adminEmails.length > 0 && config.adminEmails.includes(userEmail);

  if (!hasRole && !inAllowlist) {
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
