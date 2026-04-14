import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatLastSynced } from '@/lib/syncTime';

type LastSyncedBadgeProps = {
  lastSyncedAt: string | null | undefined;
  fallbackText?: string;
  className?: string;
  iconClassName?: string;
};

export function LastSyncedBadge({
  lastSyncedAt,
  fallbackText = 'Workspace connected',
  className,
  iconClassName,
}: LastSyncedBadgeProps) {
  const formatted = formatLastSynced(lastSyncedAt);

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full bg-emerald-50/70 px-2.5 py-1 text-[11px] font-medium text-emerald-700',
        className,
      )}
      title={formatted.tooltipText ?? undefined}
    >
      <RefreshCw
        className={cn('h-3.5 w-3.5 shrink-0 text-emerald-500', iconClassName)}
        aria-hidden="true"
      />
      <span className="truncate">
        {formatted.isSynced ? `Synced ${formatted.displayText}` : fallbackText}
      </span>
    </span>
  );
}
