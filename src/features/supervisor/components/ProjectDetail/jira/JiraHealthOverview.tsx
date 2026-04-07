import { RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useJiraHealth } from '../../../hooks/useJiraHealth';
import type { JiraHealth } from '../../../types';
import { JiraHealthSkeleton } from './JiraHealthSkeleton';
import { JiraStatCards } from './JiraStatCards';
import { JiraBugRatioBar } from './JiraBugRatioBar';
import { JiraStatusDonut } from './JiraStatusDonut';
import { JiraTypeDistribution } from './JiraTypeDistribution';

type JiraHealthOverviewProps = {
  /** Pass supervisorApi.getJiraHealth or studentApi.getJiraHealth */
  fetcher: (projectId: string) => Promise<JiraHealth>;
  /** Optional sync action (supervisor-only) to pull fresh issues from Jira before reload. */
  syncer?: (projectId: string) => Promise<JiraHealth>;
  projectId: string;
};

function formatSyncedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function JiraHealthOverview({ fetcher, syncer, projectId }: JiraHealthOverviewProps) {
  const { health, isLoading, error, reload } = useJiraHealth(fetcher, projectId);

  async function handleRefresh() {
    try {
      if (syncer) {
        await syncer(projectId);
      }
    } finally {
      await reload();
    }
  }

  if (isLoading) {
    return <JiraHealthSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  // Cache not yet populated — initial sync is still in progress
  if (!health || health.lastSyncedAt === null) {
    return (
      <EmptyState
        title="Sync in progress"
        description="Jira issue data is being fetched for the first time. This usually takes a few seconds. Refresh to check if it's ready."
        secondaryAction={{ label: 'Refresh', onClick: () => void handleRefresh() }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 4 stat cards */}
      <JiraStatCards health={health} />

      {/* Bug ratio */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <JiraBugRatioBar bugRatio={health.bugRatio} />
      </div>

      {/* SVG charts side-by-side */}
      <div className="grid gap-4 sm:grid-cols-2">
        <JiraStatusDonut health={health} />
        <JiraTypeDistribution health={health} />
      </div>

      {/* Last synced timestamp */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <RefreshCw className="h-3 w-3 shrink-0" />
        <span>Last synced {formatSyncedAt(health.lastSyncedAt)}</span>
      </div>
    </div>
  );
}
