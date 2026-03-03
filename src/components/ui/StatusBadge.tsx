import type { QueryStatus } from '../../api/types';

type StatusBadgeStatus = QueryStatus | 'error' | 'loading';

interface StatusBadgeProps {
  status: StatusBadgeStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<StatusBadgeStatus, string> = {
    OK: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    REFUSED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    UNINITIALIZED: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
    error: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    loading: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
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