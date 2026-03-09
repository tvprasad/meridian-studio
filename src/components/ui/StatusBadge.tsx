import type { QueryStatus } from '../../api/types';

type StatusBadgeStatus = QueryStatus | 'error' | 'loading';

interface StatusBadgeProps {
  status: StatusBadgeStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<StatusBadgeStatus, string> = {
    OK: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
    REFUSED: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800',
    UNINITIALIZED: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700',
    error: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800',
    loading: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800',
  };

  const dots: Record<StatusBadgeStatus, string> = {
    OK: 'bg-emerald-500',
    REFUSED: 'bg-amber-500',
    UNINITIALIZED: 'bg-gray-400',
    error: 'bg-red-500',
    loading: 'bg-blue-500',
  };

  const glows: Record<StatusBadgeStatus, string> = {
    OK:            '0 0 6px 2px rgba(16,185,129,0.65)',
    REFUSED:       '0 0 6px 2px rgba(245,158,11,0.65)',
    UNINITIALIZED: '0 0 4px 1px rgba(156,163,175,0.4)',
    error:         '0 0 6px 2px rgba(239,68,68,0.65)',
    loading:       '0 0 6px 2px rgba(59,130,246,0.65)',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[status]} ${status === 'OK' ? 'animate-pulse' : ''}`}
        style={{ boxShadow: glows[status] }}
      />
      {status}
    </span>
  );
}