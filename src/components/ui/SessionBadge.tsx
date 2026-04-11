// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.
//
// SessionBadge — shows active aiPolaris session + Clear Session control (ADR-011)
// Session data is memory-only — never written to localStorage. ADR-011.

import { MessageSquare, X } from 'lucide-react';

interface SessionBadgeProps {
  sessionId: string | null;
  onClear: () => void;
}

export function SessionBadge({ sessionId, onClear }: SessionBadgeProps) {
  if (!sessionId) return null;

  // Show only the last 8 chars of the session ID for readability
  const shortId = sessionId.slice(-8);

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-xs text-purple-700 dark:text-purple-300">
      <MessageSquare className="w-3 h-3 shrink-0" />
      <span className="font-medium">Session active</span>
      <span className="font-mono text-purple-400 dark:text-purple-500 text-[10px]">
        ···{shortId}
      </span>
      <span className="text-purple-300 dark:text-purple-600">·</span>
      <span className="text-[10px] text-purple-500 dark:text-purple-400">
        Follow-up questions use this context
      </span>
      <button
        onClick={onClear}
        title="Clear session — next query starts fresh"
        className="ml-0.5 p-0.5 rounded-full hover:bg-purple-200 dark:hover:bg-purple-500/20 transition-colors"
        aria-label="Clear session"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
