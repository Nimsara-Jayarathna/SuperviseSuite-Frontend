import { Activity, BarChart3, ExternalLink, Link2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { useJiraHealth } from '../../../hooks/useJiraHealth';
import type { JiraHealth, JiraSprintProgress } from '../../../types';
import { JiraHealthSkeleton } from './JiraHealthSkeleton';
import { JiraStatCards } from './JiraStatCards';
import { JiraBugRatioBar } from './JiraBugRatioBar';
import { JiraStatusDonut } from './JiraStatusDonut';
import { JiraTypeDistribution } from './JiraTypeDistribution';
import { JiraSprintProgressSection } from './JiraSprintProgressSection';

type JiraHealthOverviewProps = {
  /** Pass supervisorApi.getJiraHealth or studentApi.getJiraHealth */
  fetcher: (projectId: string) => Promise<JiraHealth>;
  /** Optional sprint progress fetcher shared by supervisor and student views. */
  sprintFetcher?: (projectId: string) => Promise<JiraSprintProgress>;
  /** Optional sync action (supervisor-only) to pull fresh issues from Jira before reload. */
  syncer?: (projectId: string) => Promise<JiraHealth>;
  projectId: string;
  workspaceName?: string | null;
  workspaceUrl?: string | null;
};

type JiraInsightsTab = 'health' | 'sprint-progress';

function formatSyncedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toRefreshApiError(error: unknown): ApiError {
  if (isApiException(error)) {
    const apiError = error.apiError;
    if (apiError.code === 'UNAUTHORIZED' || apiError.status === 401) {
      return {
        ...apiError,
        message: 'Jira authorization has expired. Reconnect Jira and try again.',
      };
    }
    if (apiError.code === 'FORBIDDEN' || apiError.status === 403) {
      return {
        ...apiError,
        message:
          'Jira denied access to this workspace. Check Jira permissions for this project and try again.',
      };
    }
    if (apiError.status === 429) {
      return {
        ...apiError,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Jira rate limit reached. Wait a minute and try again.',
      };
    }
    if (apiError.code === 'SERVICE_UNAVAILABLE' || apiError.status === 503) {
      return {
        ...apiError,
        message:
          'Unable to refresh Jira data right now. Jira may be temporarily unreachable. Please try again.',
      };
    }
    return apiError;
  }

  return {
    code: 'INTERNAL_ERROR',
    message: 'Unable to refresh Jira data right now. Please try again.',
    details: [],
    timestamp: new Date().toISOString(),
    status: 0,
    error: 'Unexpected Error',
    path: '',
    traceId: null,
  };
}

export function JiraHealthOverview({
  fetcher,
  sprintFetcher,
  syncer,
  projectId,
  workspaceName,
  workspaceUrl,
}: JiraHealthOverviewProps) {
  const { health, isLoading, error, reload, applyHealth } = useJiraHealth(fetcher, projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<ApiError | null>(null);
  const [activeInsightsTab, setActiveInsightsTab] = useState<JiraInsightsTab>('health');
  const autoRefreshAttemptedProjectId = useRef<string | null>(null);
  const canRefresh = Boolean(syncer);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setRefreshError(null);
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
    } catch (caughtError) {
      setRefreshError(toRefreshApiError(caughtError));
    } finally {
      setIsRefreshing(false);
    }
  }, [applyHealth, isRefreshing, projectId, reload, syncer]);

  useEffect(() => {
    const shouldAutoRefresh =
      canRefresh &&
      health?.lastSyncedAt === null &&
      !isLoading &&
      !isRefreshing &&
      autoRefreshAttemptedProjectId.current !== projectId;

    if (!shouldAutoRefresh) {
      return;
    }

    autoRefreshAttemptedProjectId.current = projectId;
    void handleRefresh();
  }, [canRefresh, handleRefresh, health?.lastSyncedAt, isLoading, isRefreshing, projectId]);

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
  const insightsTabs: Array<{ value: JiraInsightsTab; label: string; icon: typeof Activity }> = [
    { value: 'health', label: 'Health', icon: Activity },
    ...(sprintFetcher
      ? [{ value: 'sprint-progress' as const, label: 'Sprint Progress', icon: BarChart3 }]
      : []),
  ];

  const contextBar = (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm transition-all hover:shadow-md">
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
        {refreshError ? (
          <ErrorState
            error={refreshError}
            onRetry={canRefresh ? () => void handleRefresh() : undefined}
          />
        ) : null}
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
      {refreshError ? (
        <ErrorState
          error={refreshError}
          onRetry={canRefresh ? () => void handleRefresh() : undefined}
        />
      ) : null}

      <nav
        className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm transition-all hover:shadow-md"
        aria-label="Jira insights tabs"
      >
        <ul className="flex flex-wrap gap-2 text-sm font-medium text-slate-700">
          {insightsTabs.map((tab) => {
            const isActive = activeInsightsTab === tab.value;
            const TabIcon = tab.icon;
            return (
              <li key={tab.value}>
                <button
                  type="button"
                  onClick={() => setActiveInsightsTab(tab.value)}
                  className={`group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 transition-all ${
                    isActive
                      ? tab.value === 'health'
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                  }`}
                  aria-pressed={isActive}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-md transition-colors ${
                      isActive
                        ? tab.value === 'health'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-amber-100 text-amber-600'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-600'
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                  </span>
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {activeInsightsTab === 'health' ? (
        <div className="space-y-4">
          <section
            id="jira-project-health"
            className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Activity className="h-4 w-4" />
                </span>
                <h2 className="text-base font-semibold tracking-wide text-slate-900">
                  Project health
                </h2>
              </div>
              <p className="text-sm text-slate-600">Snapshot from synced Jira issues</p>
            </div>
            <JiraStatCards health={health} />
          </section>

          <section
            id="jira-quality-signals"
            className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <h2 className="text-base font-semibold tracking-wide text-slate-900">
                Quality signals
              </h2>
              <p className="text-sm text-slate-600">Open bug pressure over active issues</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:shadow-md">
              <JiraBugRatioBar bugRatio={health.bugRatio} />
            </div>
          </section>

          <section
            id="jira-distribution"
            className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <h2 className="text-base font-semibold tracking-wide text-slate-900">
                Issue distribution
              </h2>
              <p className="text-sm text-slate-600">Status and type composition</p>
            </div>

            <div className="grid items-stretch gap-4 lg:grid-cols-2">
              <JiraStatusDonut health={health} />
              <JiraTypeDistribution health={health} />
            </div>
          </section>
        </div>
      ) : null}

      {activeInsightsTab === 'sprint-progress' && sprintFetcher ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <JiraSprintProgressSection fetcher={sprintFetcher} projectId={projectId} />
        </div>
      ) : null}
    </div>
  );
}
