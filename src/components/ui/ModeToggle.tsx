// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.
//
// ModeToggle — RAG Query | Agent Query mode selector (ADR-011)

import { Zap, GitBranch, AlertCircle } from 'lucide-react';

export type QueryMode = 'rag' | 'agent';

interface ModeToggleProps {
  mode: QueryMode;
  onChange: (mode: QueryMode) => void;
  complexityHint?: boolean;   // show "looks multi-step" suggestion banner
  disabled?: boolean;
}

export function ModeToggle({ mode, onChange, complexityHint = false, disabled = false }: ModeToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-1 gap-1">
        {/* RAG Query */}
        <button
          onClick={() => !disabled && onChange('rag')}
          disabled={disabled}
          className={[
            'relative flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-lg text-left transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
            mode === 'rag'
              ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ].join(' ')}
          aria-pressed={mode === 'rag'}
        >
          <div className="flex items-center gap-1.5">
            <Zap className={[
              'w-3.5 h-3.5 transition-colors',
              mode === 'rag' ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500',
            ].join(' ')} />
            <span className="text-sm font-semibold tracking-tight">RAG Query</span>
            {mode === 'rag' && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                active
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight pl-5">
            Direct retrieval · Fast · Stateless
          </span>
        </button>

        {/* Agent Query */}
        <button
          onClick={() => !disabled && onChange('agent')}
          disabled={disabled}
          className={[
            'relative flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-lg text-left transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
            mode === 'agent'
              ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          ].join(' ')}
          aria-pressed={mode === 'agent'}
        >
          <div className="flex items-center gap-1.5">
            <GitBranch className={[
              'w-3.5 h-3.5 transition-colors',
              mode === 'agent' ? 'text-purple-500' : 'text-gray-400 dark:text-gray-500',
            ].join(' ')} />
            <span className="text-sm font-semibold tracking-tight">Agent Query</span>
            {mode === 'agent' && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                active
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight pl-5">
            Planner → Retriever → Synthesizer · Citations · Session
          </span>
        </button>
      </div>

      {/* Complexity hint banner — shown when query looks multi-step and user is on RAG */}
      {complexityHint && mode === 'rag' && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-xs text-purple-700 dark:text-purple-300">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            This looks like a multi-step question.{' '}
            <button
              onClick={() => onChange('agent')}
              className="font-semibold underline underline-offset-2 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
            >
              Switch to Agent Query
            </button>
            {' '}for a more thorough answer.
          </span>
        </div>
      )}
    </div>
  );
}
