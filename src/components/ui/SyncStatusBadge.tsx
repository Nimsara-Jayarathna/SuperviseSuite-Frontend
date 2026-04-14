import { cn } from '@/lib/cn';
import { normalizeSyncStatus, toSyncHealthLabel, toSyncLabel } from '@/lib/syncStatus';

type SyncStatusBadgeProps = {
  syncStatus: string | null | undefined;
  mode?: 'health' | 'sync';
  className?: string;
};

export function SyncStatusBadge({ syncStatus, mode = 'health', className }: SyncStatusBadgeProps) {
  const normalized = normalizeSyncStatus(syncStatus);
  const label = mode === 'health' ? toSyncHealthLabel(normalized) : toSyncLabel(normalized);

  const toneClass =
    normalized === 'SUCCESS'
      ? 'text-emerald-600'
      : normalized === 'IN_PROGRESS'
        ? 'text-indigo-600'
        : normalized === 'FAILED'
          ? 'text-rose-600'
          : 'text-slate-500';

  const dotClass =
    normalized === 'SUCCESS'
      ? 'bg-emerald-500'
      : normalized === 'IN_PROGRESS'
        ? 'bg-indigo-500 animate-pulse'
        : normalized === 'FAILED'
          ? 'bg-rose-500'
          : 'bg-slate-300';

  return (
    <span
      className={cn('flex items-center gap-1.5 text-[11px] font-semibold', toneClass, className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      {label}
    </span>
  );
}
