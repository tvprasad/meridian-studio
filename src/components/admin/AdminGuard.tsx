// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { type ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Card } from '../ui/Card';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Role guard for platform-admin pages.
 * Checks for "operator" role in MSAL token claims.
 * When auth is disabled, all users are considered operators.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { authEnabled, roles } = useAuth();

  // Auth disabled — no RBAC enforcement
  if (!authEnabled) return <>{children}</>;

  // Check for operator role
  const isOperator = roles.includes('operator') || roles.includes('admin') || roles.includes('platform-admin');

  if (!isOperator) {
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
