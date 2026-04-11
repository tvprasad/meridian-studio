// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.
//
// StageProgress — live animated stage indicator for aiPolaris DAG (ADR-011)
// Shows Planning → Retrieving → Synthesizing as each node completes.

import { BrainCircuit, Search, PenLine, Check, XCircle, Loader2 } from 'lucide-react';
import type { DagNodeState, DagStage } from '../../api/aipolaris';

interface StageProgressProps {
  nodes: DagNodeState[];
}

const STAGE_ICONS: Record<DagStage, React.ComponentType<{ className?: string }>> = {
  planner:     BrainCircuit,
  retriever:   Search,
  synthesizer: PenLine,
};

const STAGE_COLORS: Record<DagStage, { idle: string; running: string; done: string; error: string }> = {
  planner: {
    idle:    'text-gray-300 dark:text-gray-600',
    running: 'text-purple-500 dark:text-purple-400',
    done:    'text-purple-600 dark:text-purple-400',
    error:   'text-red-500',
  },
  retriever: {
    idle:    'text-gray-300 dark:text-gray-600',
    running: 'text-blue-500 dark:text-blue-400',
    done:    'text-blue-600 dark:text-blue-400',
    error:   'text-red-500',
  },
  synthesizer: {
    idle:    'text-gray-300 dark:text-gray-600',
    running: 'text-emerald-500 dark:text-emerald-400',
    done:    'text-emerald-600 dark:text-emerald-400',
    error:   'text-red-500',
  },
};

const CONNECTOR_COLORS: Record<string, string> = {
  idle:    'bg-gray-200 dark:bg-gray-700',
  running: 'bg-gray-200 dark:bg-gray-700',
  done:    'bg-purple-300 dark:bg-purple-700',
  error:   'bg-red-300 dark:bg-red-700',
};

function StageNode({ node }: { node: DagNodeState }) {
  const Icon = STAGE_ICONS[node.stage];
  const colors = STAGE_COLORS[node.stage];
  const iconColor = colors[node.status];

  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px]">
      {/* Icon container */}
      <div className={[
        'relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300',
        node.status === 'idle'
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
          : node.status === 'running'
          ? 'border-current bg-white dark:bg-gray-900 shadow-sm ' + iconColor
          : node.status === 'done'
          ? 'border-current bg-white dark:bg-gray-900 ' + iconColor
          : 'border-red-400 bg-white dark:bg-gray-900',
      ].join(' ')}>
        {node.status === 'running' ? (
          <Loader2 className={`w-4 h-4 animate-spin ${iconColor}`} />
        ) : node.status === 'done' ? (
          <Check className={`w-4 h-4 ${iconColor}`} />
        ) : node.status === 'error' ? (
          <XCircle className="w-4 h-4 text-red-500" />
        ) : (
          <Icon className={`w-4 h-4 ${iconColor}`} />
        )}
      </div>

      {/* Label */}
      <span className={[
        'text-[10px] font-semibold uppercase tracking-wider transition-colors',
        node.status === 'idle' ? 'text-gray-400 dark:text-gray-600' : iconColor,
      ].join(' ')}>
        {node.label}
      </span>

      {/* Sublabel */}
      <span className={[
        'text-[10px] text-center leading-tight transition-colors',
        node.status === 'idle'    ? 'text-gray-300 dark:text-gray-700' :
        node.status === 'running' ? 'text-gray-500 dark:text-gray-400 animate-pulse' :
        node.status === 'error'   ? 'text-red-400' :
                                    'text-gray-500 dark:text-gray-400',
      ].join(' ')}>
        {node.status === 'running' ? node.sublabel :
         node.status === 'done' && node.latency_ms
           ? `${Math.round(node.latency_ms)}ms`
           : node.sublabel}
      </span>
    </div>
  );
}

export function StageProgress({ nodes }: StageProgressProps) {
  if (nodes.every(n => n.status === 'idle')) return null;

  return (
    <div className="flex items-center justify-center gap-0 py-3">
      {nodes.map((node, idx) => (
        <div key={node.stage} className="flex items-center">
          <StageNode node={node} />
          {idx < nodes.length - 1 && (
            <div className="flex items-center mx-1 mb-5">
              {/* Animated connector arrow */}
              <div className={[
                'h-0.5 w-8 transition-all duration-500',
                CONNECTOR_COLORS[nodes[idx].status] ?? CONNECTOR_COLORS.idle,
              ].join(' ')} />
              <div className={[
                'w-0 h-0 border-t-[3px] border-b-[3px] border-l-[5px] border-t-transparent border-b-transparent transition-colors duration-500',
                nodes[idx].status === 'done'
                  ? 'border-l-purple-300 dark:border-l-purple-700'
                  : 'border-l-gray-200 dark:border-l-gray-700',
              ].join(' ')} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
