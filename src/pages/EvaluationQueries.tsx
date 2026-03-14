// Copyright (c) 2026 VPL Solutions. All rights reserved.
// Licensed under the MIT License. See LICENSE for details.

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { meridianApi } from '../api/meridian';
import {
  BarChart3,
  Activity,
  ShieldAlert,
  Timer,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  DatabaseZap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ChevronDown,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import type { EvaluationQueryEntry } from '../api/types';

const EVAL_FEEDBACK_KEY = 'meridian-eval-feedback';

function loadEvalFeedback(): Record<string, 'up' | 'down'> {
  try {
    const stored = localStorage.getItem(EVAL_FEEDBACK_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function FeedbackCell({ entry }: { entry: EvaluationQueryEntry }) {
  const [rating, setRating] = useState<'up' | 'down' | null>(
    () => loadEvalFeedback()[entry.trace_id] ?? entry.feedback ?? null
  );

  const toggle = (value: 'up' | 'down') => {
    const next = rating === value ? null : value;
    setRating(next);
    const all = loadEvalFeedback();
    if (next) all[entry.trace_id] = next;
    else delete all[entry.trace_id];
    localStorage.setItem(EVAL_FEEDBACK_KEY, JSON.stringify(all));
    meridianApi.submitFeedback(entry.trace_id, next).catch(() => {});
  };

  const tooltip = entry.status === 'REFUSED'
    ? 'Was this refusal appropriate?'
    : 'Was this answer correct?';

  return (
    <td className="px-4 py-3">
      <span className="inline-flex items-center gap-1" title={tooltip}>
        <button
          onClick={() => toggle('up')}
          className={`p-0.5 rounded transition-colors ${
            rating === 'up'
              ? 'text-emerald-500'
              : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => toggle('down')}
          className={`p-0.5 rounded transition-colors ${
            rating === 'down'
              ? 'text-red-500'
              : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </span>
    </td>
  );
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

type SortField = 'timestamp' | 'status' | 'confidence' | 't_total_ms' | 'source';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'ALL' | 'OK' | 'REFUSED';
type SourceFilter = 'ALL' | 'query' | 'agent';

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OK: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    REFUSED: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    UNINITIALIZED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.UNINITIALIZED}`}>
      {status}
    </span>
  );
}

function ConfidenceCells({ entry }: { entry: EvaluationQueryEntry }) {
  const conf = entry.confidence;
  const raw = entry.raw_confidence;
  if (conf == null) return <td className="px-4 py-3 text-gray-400 dark:text-gray-600">—</td>;

  const isCalibrated = raw != null && Math.abs(raw - conf) > 0.001;
  const pct = (conf * 100).toFixed(1);
  const rawPct = raw != null ? (raw * 100).toFixed(1) : null;

  return (
    <>
      <td className="px-4 py-3 text-sm tabular-nums dark:text-gray-300">
        {isCalibrated ? (
          <span title={`Raw: ${rawPct}% — Calibrated: ${pct}%`}>
            <span className="text-gray-400 dark:text-gray-500">{rawPct}%</span>
            <span className="text-gray-300 dark:text-gray-600 mx-1">&rarr;</span>
            <span className="font-medium">{pct}%</span>
          </span>
        ) : (
          <span className="font-medium">{pct}%</span>
        )}
      </td>
    </>
  );
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300 dark:text-gray-600" />;
  return sortDir === 'asc'
    ? <ArrowUp className="w-3 h-3 text-primary-500" />
    : <ArrowDown className="w-3 h-3 text-primary-500" />;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  subtitle,
  description,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
  description?: string;
}) {
  return (
    <Card className="group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
          {description && <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 leading-relaxed">{description}</p>}
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor} group-hover:scale-110 transition-transform duration-200`} />
        </div>
      </div>
    </Card>
  );
}

function compareFn(a: EvaluationQueryEntry, b: EvaluationQueryEntry, field: SortField, dir: SortDir): number {
  let cmp = 0;
  switch (field) {
    case 'timestamp':
      cmp = a.timestamp.localeCompare(b.timestamp);
      break;
    case 'status':
      cmp = a.status.localeCompare(b.status);
      break;
    case 'confidence':
      cmp = (a.confidence ?? -1) - (b.confidence ?? -1);
      break;
    case 't_total_ms':
      cmp = (a.t_total_ms ?? -1) - (b.t_total_ms ?? -1);
      break;
    case 'source':
      cmp = a.source.localeCompare(b.source);
      break;
  }
  return dir === 'asc' ? cmp : -cmp;
}

function EvaluationGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="font-medium">Understanding these metrics</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Metrics</h4>
            <dl className="space-y-2">
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Total Queries</dt>
                <dd>Number of queries processed in the last 30 days, split by source (direct Ask Meridian queries vs AI Operations Agent tool calls).</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Avg Confidence</dt>
                <dd>Mean retrieval confidence across all scored queries. Higher is better. When calibration is enabled, this reflects the calibrated probability, not the raw L2-distance proxy. Aim for 60%+ to indicate strong knowledge base coverage.</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Refusal Rate</dt>
                <dd>Percentage of queries where confidence fell below the retrieval threshold, triggering a REFUSED response. A high rate ({'>'}30%) suggests knowledge gaps or an overly strict threshold. Tune via Settings.</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Latency P50 / P95</dt>
                <dd>End-to-end response time: retrieval (vector search) + generation (LLM). P50 is the median, P95 catches tail latency. Agent queries are naturally slower due to multi-step tool reasoning.</dd>
              </div>
            </dl>
          </div>
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Query Log Columns</h4>
            <dl className="space-y-2">
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Status</dt>
                <dd><span className="font-medium text-emerald-600">OK</span> = answered successfully. <span className="font-medium text-red-500">REFUSED</span> = confidence below threshold, no answer generated. This is a governance gate, not an error.</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Confidence</dt>
                <dd>Retrieval similarity score. When calibration is enabled, shows <span className="text-gray-400">Raw%</span> &rarr; <span className="font-medium">Calibrated%</span>. Raw is the L2-distance proxy; calibrated is the isotonic-regression-adjusted probability.</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Chunks</dt>
                <dd>Shows "above threshold / total retrieved". For example, 3/5 means 3 of 5 retrieved document chunks scored above the confidence threshold. More chunks above = stronger retrieval signal.</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Source</dt>
                <dd><span className="text-blue-600 font-medium">query</span> = direct Ask Meridian question. <span className="text-violet-600 font-medium">agent</span> = AI Operations Agent tool call (typically longer latency due to multi-step reasoning).</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

export function EvaluationQueries() {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['evaluation-metrics'],
    queryFn: () => meridianApi.evaluationMetrics(),
    refetchInterval: 60_000,
  });

  const { data: queries, isLoading: queriesLoading } = useQuery({
    queryKey: ['evaluation-queries', pageSize, offset],
    queryFn: () => meridianApi.evaluationQueries(pageSize, offset),
    refetchInterval: 30_000,
  });

  const isLoading = metricsLoading || queriesLoading;
  const notConfigured = metrics?.configured === false || queries?.configured === false;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'timestamp' ? 'desc' : 'asc');
    }
  };

  const hasFilters = statusFilter !== 'ALL' || sourceFilter !== 'ALL';

  const filteredAndSorted = useMemo(() => {
    let rows = queries?.queries ?? [];
    if (statusFilter !== 'ALL') rows = rows.filter((r) => r.status === statusFilter);
    if (sourceFilter !== 'ALL') rows = rows.filter((r) => r.source === sourceFilter);
    if (sortField) rows = [...rows].sort((a, b) => compareFn(a, b, sortField, sortDir));
    return rows;
  }, [queries?.queries, statusFilter, sourceFilter, sortField, sortDir]);

  if (notConfigured) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Evaluation</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Query telemetry and retrieval quality metrics.</p>
        <Card className="mt-8 border-l-4 border-l-amber-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Database not configured</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Set the <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">DATABASE_URL</code> environment variable on the Meridian API to enable query telemetry.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const total = queries?.total ?? 0;
  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.ceil(total / pageSize);

  const thClass = 'px-4 py-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-white/5 transition-colors';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Evaluation</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor retrieval quality, confidence accuracy, and response latency across all queries — identify knowledge gaps, tune thresholds, and track the impact of ingestion changes.</p>
      <EvaluationGuide />

      {/* Metrics summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-white/[0.05] rounded-xl border border-gray-200 dark:border-white/10 p-6 animate-pulse">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : metrics && metrics.total_queries != null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <MetricCard
            label="Total Queries"
            value={metrics.total_queries.toLocaleString()}
            icon={BarChart3}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/20"
            subtitle={metrics.queries_by_source ? `${metrics.queries_by_source.query ?? 0} direct · ${metrics.queries_by_source.agent ?? 0} agent` : undefined}
            description="Total queries processed across all sources in the last 30 days."
          />
          <MetricCard
            label="Avg Confidence"
            value={metrics.avg_confidence != null ? `${(metrics.avg_confidence * 100).toFixed(1)}%` : '—'}
            icon={Activity}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
            description="Mean retrieval confidence score across all queries with scored results."
          />
          <MetricCard
            label="Refusal Rate"
            value={metrics.refusal_rate != null ? `${(metrics.refusal_rate * 100).toFixed(1)}%` : '—'}
            icon={ShieldAlert}
            iconColor="text-red-600"
            iconBg="bg-red-50 dark:bg-red-900/20"
            subtitle={metrics.queries_by_status ? `${metrics.queries_by_status.REFUSED ?? 0} refused of ${metrics.total_queries}` : undefined}
            description="Percentage of queries refused due to confidence below the retrieval threshold."
          />
          <MetricCard
            label="Latency P50 / P95"
            value={
              metrics.latency_p50_ms != null && metrics.latency_p95_ms != null
                ? `${(metrics.latency_p50_ms / 1000).toFixed(1)}s / ${(metrics.latency_p95_ms / 1000).toFixed(1)}s`
                : '—'
            }
            icon={Timer}
            iconColor="text-violet-600"
            iconBg="bg-violet-50 dark:bg-violet-900/20"
            description="End-to-end response time at the 50th and 95th percentile (retrieve + generate)."
          />
        </div>
      ) : null}

      {/* Query log table */}
      <Card className="mt-8" padding="none">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DatabaseZap className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Query Log</h2>
            {total > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {hasFilters ? `${filteredAndSorted.length} of ` : ''}{total.toLocaleString()} {total === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="text-xs border border-gray-200 dark:border-white/15 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-400"
              >
                <option value="ALL">All statuses</option>
                <option value="OK">OK</option>
                <option value="REFUSED">REFUSED</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                className="text-xs border border-gray-200 dark:border-white/15 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-400"
              >
                <option value="ALL">All sources</option>
                <option value="query">query</option>
                <option value="agent">agent</option>
              </select>
              {hasFilters && (
                <button
                  onClick={() => { setStatusFilter('ALL'); setSourceFilter('ALL'); }}
                  title="Clear filters"
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
            {/* Page size + Pagination */}
            <div className="flex items-center gap-2 text-sm border-l border-gray-200 dark:border-white/10 pl-3">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setOffset(0); }}
                className="text-xs border border-gray-200 dark:border-white/15 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-400"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>
              {totalPages > 1 && (
                <>
                  <button
                    onClick={() => setOffset(Math.max(0, offset - pageSize))}
                    disabled={offset === 0}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <span className="text-gray-500 dark:text-gray-400 tabular-nums text-xs">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + pageSize)}
                    disabled={offset + pageSize >= total}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {queriesLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : !queries?.queries?.length ? (
          <div className="p-12 text-center">
            <DatabaseZap className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">No queries recorded yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Query telemetry will appear here after the first query.</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No queries match the current filters.</p>
            <button
              onClick={() => { setStatusFilter('ALL'); setSourceFilter('ALL'); }}
              className="text-xs text-primary-600 hover:text-primary-700 mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className={thClass} onClick={() => handleSort('timestamp')} title="When the query was processed">
                    <span className="inline-flex items-center gap-1">Time <SortIcon field="timestamp" sortField={sortField} sortDir={sortDir} /></span>
                  </th>
                  <th className="px-4 py-3" title="The user's natural-language question">Question</th>
                  <th className={thClass} onClick={() => handleSort('status')} title="OK = answered, REFUSED = confidence below threshold">
                    <span className="inline-flex items-center gap-1">Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} /></span>
                  </th>
                  <th className={thClass} onClick={() => handleSort('confidence')} title="Retrieval confidence score (calibrated when enabled, shows Raw → Calibrated)">
                    <span className="inline-flex items-center gap-1">Confidence <SortIcon field="confidence" sortField={sortField} sortDir={sortDir} /></span>
                  </th>
                  <th className="px-4 py-3" title="Chunks above threshold / total chunks retrieved">Chunks</th>
                  <th className={thClass} onClick={() => handleSort('t_total_ms')} title="End-to-end response time (retrieval + generation)">
                    <span className="inline-flex items-center gap-1">Latency <SortIcon field="t_total_ms" sortField={sortField} sortDir={sortDir} /></span>
                  </th>
                  <th className={thClass} onClick={() => handleSort('source')} title="Query origin: direct query or AI Operations Agent">
                    <span className="inline-flex items-center gap-1">Source <SortIcon field="source" sortField={sortField} sortDir={sortDir} /></span>
                  </th>
                  <th className="px-4 py-3" title="Human rating: was this answer correct or refusal appropriate?">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {filteredAndSorted.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 max-w-xs truncate" title={entry.question ?? ''}>
                      {entry.question ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} />
                    </td>
                    <ConfidenceCells entry={entry} />
                    <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                      {entry.chunks_retrieved != null ? (
                        <span title={`${entry.chunks_above ?? 0} above threshold of ${entry.chunks_retrieved}`}>
                          {entry.chunks_above ?? 0}/{entry.chunks_retrieved}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {entry.t_total_ms != null ? `${(entry.t_total_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        entry.source === 'agent'
                          ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {entry.source}
                      </span>
                    </td>
                    <FeedbackCell entry={entry} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
