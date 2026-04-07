import { ExternalLink, Link2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { buttonStyles } from '@/components/ui/Button';
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
  workspaceName?: string | null;
  workspaceUrl?: string | null;
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

export function JiraHealthOverview({
  fetcher,
  syncer,
  projectId,
  workspaceName,
  workspaceUrl,
}: JiraHealthOverviewProps) {
  const { health, isLoading, error, reload, applyHealth } = useJiraHealth(fetcher, projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const canRefresh = Boolean(syncer);

  async function handleRefresh() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      if (syncer) {
        const refreshedHealth = await syncer(projectId);
        const refreshedAt = new Date().toISOString();
        setLastRefreshAt(refreshedAt);
        applyHealth({
          ...refreshedHealth,
          // Keep the UI responsive even if backend minute value appears unchanged.
          lastSyncedAt: refreshedHealth.lastSyncedAt ?? refreshedAt,
        });
      } else {
        await reload();
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  if (isLoading) {
    return <JiraHealthSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  const workspaceLabel = workspaceName?.trim() ? workspaceName : 'Connected workspace';
  const syncedAtIso = health?.lastSyncedAt ?? lastRefreshAt;
  const syncedAtLabel = syncedAtIso ? formatSyncedAt(syncedAtIso) : 'Not synced yet';
  const isJustRefreshed =
    lastRefreshAt !== null && Date.now() - new Date(lastRefreshAt).getTime() < 2 * 60 * 1000;

  const contextBar = (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Link2 className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            {workspaceUrl ? (
              <a
                href={workspaceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center gap-1 truncate text-base font-semibold text-slate-900 hover:underline"
                title={workspaceUrl}
              >
                <span className="truncate">{workspaceLabel}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : (
              <p className="truncate text-base font-semibold text-slate-900">{workspaceLabel}</p>
            )}
            <p className="text-sm text-slate-600">Jira workspace</p>
          </div>

          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Connected
          </span>
        </div>

        {canRefresh ? (
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm', className: 'gap-1.5' })}
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
        <RefreshCw className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        <span>
          Last synced {syncedAtLabel}
          {isJustRefreshed ? ' (just now)' : ''}
        </span>
      </div>
    </section>
  );

  if (!health || health.lastSyncedAt === null) {
    return (
      <div className="space-y-4">
        {contextBar}
        <EmptyState
          title="Sync in progress"
          description="Jira issue data is being fetched for the first time. This usually takes a few seconds. Use Refresh in the Jira header to check again."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {contextBar}

      <nav className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
        <ul className="flex flex-wrap gap-2 text-sm font-medium text-slate-700">
          <li>
            <a
              href="#jira-project-health"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-100"
            >
              Health
            </a>
          </li>
          <li>
            <a
              href="#jira-quality-signals"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-100"
            >
              Quality
            </a>
          </li>
          <li>
            <a
              href="#jira-distribution"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-100"
            >
              Distribution
            </a>
          </li>
        </ul>
      </nav>

      <section id="jira-project-health" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-wide text-slate-900">Project health</h2>
          <p className="text-sm text-slate-600">Snapshot from synced Jira issues</p>
        </div>
        <JiraStatCards health={health} />
      </section>

      <section id="jira-quality-signals" className="space-y-3">
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <h2 className="text-base font-semibold tracking-wide text-slate-900">Quality signals</h2>
          <p className="text-sm text-slate-600">Open bug pressure over active issues</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <JiraBugRatioBar bugRatio={health.bugRatio} />
        </div>
      </section>

      <section id="jira-distribution" className="space-y-3">
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <h2 className="text-base font-semibold tracking-wide text-slate-900">Issue distribution</h2>
          <p className="text-sm text-slate-600">Status and type composition</p>
        </div>

        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <JiraStatusDonut health={health} />
          <JiraTypeDistribution health={health} />
        </div>
      </section>
    </div>
  );
}
