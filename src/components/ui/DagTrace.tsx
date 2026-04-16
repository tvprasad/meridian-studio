// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.
//
// DagTrace — Interactive animated Planner → Retriever → Synthesizer visualization
// ADR-011: Makes the aiPolaris DAG execution tangible and auditable in real time.
//
// Design:
//   - Three node cards animate in as each stage completes (not shown upfront)
//   - Connecting arrows draw left-to-right as stages complete
//   - Clicking a node expands a drawer showing that stage's output
//   - Nodes pulse amber while running, green on done, red on error
//   - Error nodes show an actionable recovery hint
//
// Trace data is memory-only — never written to localStorage. ADR-011.

import { useState } from 'react';
import {
  BrainCircuit, Search, PenLine, ChevronDown, ChevronUp,
  AlertCircle, FileText, Hash, Clock, CheckCircle2, XCircle,
  Loader2, ArrowRight,
} from 'lucide-react';
import type { DagNodeState, DagStage, PolarisCitation, PolarisChunk } from '../../api/aipolaris';

// ── Stage config ──────────────────────────────────────────────────────────────

interface StageConfig {
  icon: React.ComponentType<{ className?: string }>;
  accent: string;          // Tailwind color token base
  ringColor: string;
  bgIdle: string;
  bgRunning: string;
  bgDone: string;
  bgError: string;
  borderRunning: string;
  borderDone: string;
  borderError: string;
  textRunning: string;
  textDone: string;
}

const STAGE_CONFIG: Record<DagStage, StageConfig> = {
  planner: {
    icon: BrainCircuit,
    accent: 'purple',
    ringColor:     'ring-purple-400 dark:ring-purple-500',
    bgIdle:        'bg-gray-50 dark:bg-gray-800/40',
    bgRunning:     'bg-purple-50 dark:bg-purple-900/20',
    bgDone:        'bg-white dark:bg-white/[0.03]',
    bgError:       'bg-red-50 dark:bg-red-900/20',
    borderRunning: 'border-purple-300 dark:border-purple-600',
    borderDone:    'border-purple-200 dark:border-purple-800',
    borderError:   'border-red-300 dark:border-red-700',
    textRunning:   'text-purple-600 dark:text-purple-400',
    textDone:      'text-purple-700 dark:text-purple-300',
  },
  retriever: {
    icon: Search,
    accent: 'blue',
    ringColor:     'ring-blue-400 dark:ring-blue-500',
    bgIdle:        'bg-gray-50 dark:bg-gray-800/40',
    bgRunning:     'bg-blue-50 dark:bg-blue-900/20',
    bgDone:        'bg-white dark:bg-white/[0.03]',
    bgError:       'bg-red-50 dark:bg-red-900/20',
    borderRunning: 'border-blue-300 dark:border-blue-600',
    borderDone:    'border-blue-200 dark:border-blue-800',
    borderError:   'border-red-300 dark:border-red-700',
    textRunning:   'text-blue-600 dark:text-blue-400',
    textDone:      'text-blue-700 dark:text-blue-300',
  },
  synthesizer: {
    icon: PenLine,
    accent: 'emerald',
    ringColor:     'ring-emerald-400 dark:ring-emerald-500',
    bgIdle:        'bg-gray-50 dark:bg-gray-800/40',
    bgRunning:     'bg-emerald-50 dark:bg-emerald-900/20',
    bgDone:        'bg-white dark:bg-white/[0.03]',
    bgError:       'bg-red-50 dark:bg-red-900/20',
    borderRunning: 'border-emerald-300 dark:border-emerald-600',
    borderDone:    'border-emerald-200 dark:border-emerald-800',
    borderError:   'border-red-300 dark:border-red-700',
    textRunning:   'text-emerald-600 dark:text-emerald-400',
    textDone:      'text-emerald-700 dark:text-emerald-300',
  },
};

// ── Drawer content per stage ──────────────────────────────────────────────────

function PlannerDrawer({ subTasks }: { subTasks?: string[] }) {
  if (!subTasks?.length) return (
    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No sub-tasks recorded.</p>
  );
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
        Decomposed into {subTasks.length} sub-task{subTasks.length !== 1 ? 's' : ''}
      </p>
      {subTasks.map((task, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-[9px] font-bold flex items-center justify-center">
            {i + 1}
          </span>
          <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{task}</span>
        </div>
      ))}
    </div>
  );
}

function RetrieverDrawer({ chunks }: { chunks?: PolarisChunk[] }) {
  if (!chunks?.length) return (
    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No chunks retrieved.</p>
  );
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
        {chunks.length} chunk{chunks.length !== 1 ? 's' : ''} retrieved
      </p>
      {chunks.map((chunk, i) => (
        <div key={i} className="rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-2.5 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{chunk.title}</span>
            </div>
            {/* Reranker score bar */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-400 dark:bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.round(chunk.reranker_score * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono w-7 text-right">
                {(chunk.reranker_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
            {chunk.content}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
            <Hash className="w-2.5 h-2.5" />
            <span className="font-mono truncate">{chunk.source}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SynthesizerDrawer({ citations }: { citations?: PolarisCitation[] }) {
  if (!citations?.length) return (
    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No citations available.</p>
  );
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
        {citations.length} citation{citations.length !== 1 ? 's' : ''} used
      </p>
      {citations.map((citation, i) => (
        <div key={i} className="rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-2.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{citation.title}</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug italic line-clamp-3 pl-4">
            "{citation.excerpt}"
          </p>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 pl-4">
            <Hash className="w-2.5 h-2.5" />
            <span className="font-mono truncate">{citation.source}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Node card ─────────────────────────────────────────────────────────────────

interface NodeCardProps {
  node: DagNodeState;
  isExpanded: boolean;
  onToggle: () => void;
}

function NodeCard({ node, isExpanded, onToggle }: NodeCardProps) {
  const cfg = STAGE_CONFIG[node.stage];
  const Icon = cfg.icon;
  const isClickable = node.status === 'done' || node.status === 'error';

  const bg = node.status === 'idle'    ? cfg.bgIdle
           : node.status === 'running' ? cfg.bgRunning
           : node.status === 'done'    ? cfg.bgDone
                                       : cfg.bgError;

  const border = node.status === 'running' ? cfg.borderRunning
               : node.status === 'done'    ? cfg.borderDone
               : node.status === 'error'   ? cfg.borderError
                                           : 'border-gray-100 dark:border-white/5';

  return (
    <div className={[
      'flex flex-col rounded-xl border transition-all duration-300 overflow-hidden',
      bg, border,
      node.status === 'running' ? 'shadow-sm ring-1 ring-offset-0 ' + cfg.ringColor : '',
      isClickable ? 'cursor-pointer' : 'cursor-default',
    ].join(' ')}>
      {/* Card header */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5"
        onClick={isClickable ? onToggle : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } } : undefined}
        aria-expanded={isClickable ? isExpanded : undefined}
        aria-label={isClickable ? `${node.stage.charAt(0).toUpperCase() + node.stage.slice(1)} stage — ${node.status}. ${isExpanded ? 'Collapse' : 'Expand'} details` : undefined}
      >
        {/* Status icon */}
        <div className={[
          'flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200',
          node.status === 'idle'    ? 'bg-gray-100 dark:bg-gray-700/50' :
          node.status === 'running' ? `bg-${cfg.accent}-100 dark:bg-${cfg.accent}-900/30` :
          node.status === 'done'    ? `bg-${cfg.accent}-50 dark:bg-${cfg.accent}-900/20` :
                                      'bg-red-100 dark:bg-red-900/30',
        ].join(' ')}>
          {node.status === 'running' ? (
            <Loader2 className={`w-3.5 h-3.5 animate-spin ${cfg.textRunning}`} />
          ) : node.status === 'done' ? (
            <Icon className={`w-3.5 h-3.5 ${cfg.textDone}`} />
          ) : node.status === 'error' ? (
            <XCircle className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Icon className="w-3.5 h-3.5 text-gray-300 dark:text-gray-500" />
          )}
        </div>

        {/* Label + sublabel */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={[
              'text-xs font-semibold',
              node.status === 'idle'  ? 'text-gray-400 dark:text-gray-500' :
              node.status === 'error' ? 'text-red-600 dark:text-red-400' :
                                        cfg.textDone,
            ].join(' ')}>
              {node.label}
            </span>
            {node.status === 'running' && (
              <span className={`text-[10px] ${cfg.textRunning} animate-pulse`}>
                {node.sublabel}
              </span>
            )}
          </div>
          {node.status === 'done' && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{node.sublabel}</span>
              {node.latency_ms !== null && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-300 dark:text-gray-500">
                  <Clock className="w-2.5 h-2.5" />
                  {Math.round(node.latency_ms)}ms
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expand chevron */}
        {isClickable && (
          <div className="shrink-0 text-gray-300 dark:text-gray-500">
            {isExpanded
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
            }
          </div>
        )}
      </div>

      {/* Error hint */}
      {node.status === 'error' && node.errorHint && (
        <div className="flex items-start gap-2 px-3 pb-2.5 text-xs text-red-500 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{node.errorHint}</span>
        </div>
      )}

      {/* Expandable drawer */}
      {isExpanded && node.status === 'done' && (
        <div className="border-t border-gray-100 dark:border-white/5 px-3 py-3 animate-in slide-in-from-top-1 duration-200">
          {node.stage === 'planner'     && <PlannerDrawer subTasks={node.subTasks} />}
          {node.stage === 'retriever'   && <RetrieverDrawer chunks={node.chunks} />}
          {node.stage === 'synthesizer' && <SynthesizerDrawer citations={node.citations} />}
        </div>
      )}
    </div>
  );
}

// ── Connector arrow ───────────────────────────────────────────────────────────

function ConnectorArrow({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center self-start mt-[22px] mx-1 shrink-0">
      <div className={[
        'h-px w-5 transition-all duration-500',
        active ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gray-150 dark:bg-gray-800',
      ].join(' ')} />
      <ArrowRight className={[
        'w-3 h-3 -ml-1 transition-colors duration-500',
        active ? 'text-gray-300 dark:text-gray-500' : 'text-gray-150 dark:text-gray-800',
      ].join(' ')} />
    </div>
  );
}

// ── Main DagTrace component ───────────────────────────────────────────────────

interface DagTraceProps {
  nodes: DagNodeState[];
  traceId?: string;
}

export function DagTrace({ nodes, traceId }: DagTraceProps) {
  const [expandedStage, setExpandedStage] = useState<DagStage | null>(null);

  // Only render once at least one node is no longer idle
  const hasStarted = nodes.some(n => n.status !== 'idle');
  if (!hasStarted) return null;

  const toggleExpand = (stage: DagStage) => {
    setExpandedStage(prev => prev === stage ? null : stage);
  };

  const connectorActive = (idx: number) =>
    nodes[idx].status === 'done' || nodes[idx].status === 'error';

  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.01] p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-purple-500 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Execution trace
          </span>
        </div>
        {traceId && (
          <span className="font-mono text-[10px] text-gray-300 dark:text-gray-700">
            {traceId.slice(0, 8)}
          </span>
        )}
      </div>

      {/* DAG pipeline */}
      <div className="flex items-start">
        {nodes.map((node, idx) => (
          <div key={node.stage} className="flex items-start flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <NodeCard
                node={node}
                isExpanded={expandedStage === node.stage}
                onToggle={() => toggleExpand(node.stage)}
              />
            </div>
            {idx < nodes.length - 1 && (
              <ConnectorArrow active={connectorActive(idx)} />
            )}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <p className="text-[10px] text-gray-300 dark:text-gray-700 text-center">
        Click a completed node to inspect its output
      </p>
    </div>
  );
}
