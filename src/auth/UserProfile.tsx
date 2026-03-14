// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { LogOut } from 'lucide-react';
import { useAuth } from './useAuth';

function getInitials(name: string): string {
  return name
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function UserProfile({ collapsed }: { collapsed: boolean }) {
  const { authEnabled, isAuthenticated, user, logout } = useAuth();

  if (!authEnabled || !isAuthenticated || !user) return null;

  const displayName = user.name || user.username || 'User';
  const initials = getInitials(displayName);

  return (
    <div className={`border-t border-white/10 ${collapsed ? 'py-3 flex flex-col items-center gap-2' : 'px-6 py-3'}`}>
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div
          className="w-7 h-7 rounded-full bg-violet-500/30 border border-violet-400/50 flex items-center justify-center shrink-0"
          title={collapsed ? displayName : undefined}
        >
          <span className="text-[10px] font-semibold text-violet-300">{initials}</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <span className="text-xs text-white/70 truncate">{displayName}</span>
            <button
              onClick={logout}
              title="Sign out"
              className="text-white/40 hover:text-white/90 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {collapsed && (
        <button
          onClick={logout}
          title="Sign out"
          className="text-white/40 hover:text-white/90 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
