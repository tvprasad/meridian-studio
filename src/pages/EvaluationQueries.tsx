import { useState } from 'react';
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
} from 'lucide-react';
import type { EvaluationQueryEntry } from '../api/types';

const PAGE_SIZE = 20;

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

function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
}) {
  return (
    <Card className="group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor} group-hover:scale-110 transition-transform duration-200`} />
        </div>
      </div>
    </Card>
  );
}

export function EvaluationQueries() {
  const [offset, setOffset] = useState(0);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['evaluation-metrics'],
    queryFn: () => meridianApi.evaluationMetrics(),
    refetchInterval: 60_000,
  });

  const { data: queries, isLoading: queriesLoading } = useQuery({
    queryKey: ['evaluation-queries', offset],
    queryFn: () => meridianApi.evaluationQueries(PAGE_SIZE, offset),
    refetchInterval: 30_000,
  });

  const isLoading = metricsLoading || queriesLoading;
  const notConfigured = metrics?.configured === false || queries?.configured === false;

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
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Evaluation</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Query telemetry and retrieval quality metrics.</p>

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
          />
          <MetricCard
            label="Avg Confidence"
            value={metrics.avg_confidence != null ? `${(metrics.avg_confidence * 100).toFixed(1)}%` : '—'}
            icon={Activity}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <MetricCard
            label="Refusal Rate"
            value={metrics.refusal_rate != null ? `${(metrics.refusal_rate * 100).toFixed(1)}%` : '—'}
            icon={ShieldAlert}
            iconColor="text-red-600"
            iconBg="bg-red-50 dark:bg-red-900/20"
            subtitle={metrics.queries_by_status ? `${metrics.queries_by_status.REFUSED ?? 0} refused of ${metrics.total_queries}` : undefined}
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
                {total.toLocaleString()} {total === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="text-gray-500 dark:text-gray-400 tabular-nums text-xs">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Chunks</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {queries.queries.map((entry) => (
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
