import {
  Activity,
  BarChart3,
  GitBranch,
  KanbanSquare,
  ExternalLink,
  Link2,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buttonStyles } from '@/components/ui/Button';
import { LastSyncedBadge } from '@/components/ui/LastSyncedBadge';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { supervisorApi } from '../../../api/supervisorApi';
import { useJiraHealth } from '../../../hooks/useJiraHealth';
import { useJiraHierarchy } from '../../../hooks/useJiraHierarchy';
import type { JiraHealth, JiraHierarchy, JiraSprintProgress, JiraWorkload } from '../../../types';
import { JiraWorkloadPanel } from './workload/JiraWorkloadPanel';
import { JiraHealthSkeleton } from './JiraHealthSkeleton';
import { JiraStatCards } from './JiraStatCards';
import { JiraBugRatioBar } from './JiraBugRatioBar';
import { JiraStatusDonut } from './JiraStatusDonut';
import { JiraTypeDistribution } from './JiraTypeDistribution';
import { JiraSprintProgressSection } from './JiraSprintProgressSection';
import { JiraHierarchyView } from './JiraHierarchyView';

type JiraHealthOverviewProps = {
  /** Pass supervisorApi.getJiraHealth or studentApi.getJiraHealth */
  fetcher: (projectId: string) => Promise<JiraHealth>;
  /** Optional sprint progress fetcher shared by supervisor and student views. */
  sprintFetcher?: (projectId: string) => Promise<JiraSprintProgress>;
  /** Optional workload fetcher shared by supervisor and student views. */
  workloadFetcher?: (projectId: string) => Promise<JiraWorkload>;
  /** Optional hierarchy fetcher shared by supervisor and student views. */
  hierarchyFetcher?: (projectId: string) => Promise<JiraHierarchy>;
  /** Optional sync action (supervisor-only) to pull fresh issues from Jira before reload. */
  syncer?: (projectId: string) => Promise<JiraHealth>;
  projectId: string;
  workspaceName?: string | null;
  workspaceUrl?: string | null;
};

type JiraInsightsTab = 'health' | 'sprint-progress' | 'workload' | 'hierarchy';

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
  workloadFetcher,
  hierarchyFetcher,
  syncer,
  projectId,
  workspaceName,
  workspaceUrl,
}: JiraHealthOverviewProps) {
  const { health, isLoading, error, reload, applyHealth } = useJiraHealth(fetcher, projectId);
  const {
    data: hierarchyData,
    isLoading: isHierarchyLoading,
    error: hierarchyError,
    hasLoaded: hierarchyHasLoaded,
    load: loadHierarchy,
  } = useJiraHierarchy(hierarchyFetcher ?? supervisorApi.getProjectJiraHierarchy, projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<ApiError | null>(null);
  const [jiraRefreshModal, setJiraRefreshModal] = useState<{
    isOpen: boolean;
    status: 'loading' | 'success' | 'error';
    title: string;
    message: string;
    retryAction?: () => void;
  }>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });
  const [activeInsightsTab, setActiveInsightsTab] = useState<JiraInsightsTab>('health');
  const autoRefreshAttemptedProjectId = useRef<string | null>(null);
  const refreshInFlightRef = useRef(false);
  const performRefreshRef = useRef<(options: { requestModal: boolean }) => Promise<void>>(
    async () => {},
  );
  const canRefresh = Boolean(syncer);

  const closeJiraRefreshModal = useCallback(() => {
    setJiraRefreshModal((current) => ({ ...current, isOpen: false }));
  }, []);

  const performRefresh = useCallback(
    async (options: { requestModal: boolean }) => {
      if (refreshInFlightRef.current) {
        return;
      }
      refreshInFlightRef.current = true;

      setIsRefreshing(true);
      setRefreshError(null);
      if (options.requestModal && syncer) {
        setJiraRefreshModal({
          isOpen: true,
          status: 'loading',
          title: 'Refreshing Jira data',
          message: 'Syncing the latest Jira issues, sprints, and workload for this project.',
        });
      }

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
          if (options.requestModal) {
            setJiraRefreshModal({
              isOpen: true,
              status: 'success',
              title: 'Jira data refreshed',
              message: 'Latest Jira data was synced and loaded successfully.',
            });
          }
        } else {
          await reload();
        }
      } catch (caughtError) {
        const apiError = toRefreshApiError(caughtError);
        if (options.requestModal && syncer) {
          setJiraRefreshModal({
            isOpen: true,
            status: 'error',
            title: 'Jira refresh failed',
            message: apiError.message,
            retryAction: () => void performRefreshRef.current({ requestModal: true }),
          });
        } else {
          setRefreshError(apiError);
        }
      } finally {
        refreshInFlightRef.current = false;
        setIsRefreshing(false);
      }
    },
    [applyHealth, projectId, reload, syncer],
  );

  performRefreshRef.current = performRefresh;

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
    void performRefresh({ requestModal: false });
  }, [canRefresh, health?.lastSyncedAt, isLoading, isRefreshing, performRefresh, projectId]);

  if (isLoading) {
    return <JiraHealthSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  const workspaceLabel = workspaceName?.trim() ? workspaceName : 'Connected workspace';
  const syncedAtIso = health?.lastSyncedAt ?? lastRefreshAt;
  const insightsTabs: Array<{ value: JiraInsightsTab; label: string; icon: typeof Activity }> = [
    { value: 'health', label: 'Health', icon: Activity },
    ...(sprintFetcher
      ? [{ value: 'sprint-progress' as const, label: 'Sprint Progress', icon: BarChart3 }]
      : []),
    ...(workloadFetcher
      ? [{ value: 'workload' as const, label: 'Team Workload', icon: Users }]
      : []),
    { value: 'hierarchy', label: 'Hierarchy', icon: GitBranch },
  ];

  function handleInsightsTabChange(tab: JiraInsightsTab) {
    setActiveInsightsTab(tab);
    if (tab === 'hierarchy' && !hierarchyHasLoaded && !isHierarchyLoading) {
      void loadHierarchy();
    }
  }

  const contextHeader = (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 pt-4 pb-3 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
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
                className="inline-flex min-w-0 items-center gap-1 truncate text-sm font-semibold text-slate-900 hover:underline"
                title={workspaceUrl}
              >
                <span className="truncate">{workspaceLabel}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <p className="truncate text-sm font-semibold text-slate-900">{workspaceLabel}</p>
            )}
            <div className="mt-0.5 flex items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Connected
              </span>
              <LastSyncedBadge
                lastSyncedAt={syncedAtIso}
                fallbackText="Not synced yet"
                className="bg-transparent p-0 text-[11px] text-slate-400"
                iconClassName="h-3 w-3 text-emerald-500"
              />
            </div>
          </div>
        </div>

        {canRefresh ? (
          <button
            type="button"
            aria-label={isRefreshing ? 'Refreshing' : 'Refresh Jira data'}
            className={buttonStyles({
              variant: 'secondary',
              size: 'sm',
              className: 'w-9 px-0',
            })}
            onClick={() => void performRefresh({ requestModal: true })}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        ) : null}
      </div>

      <div className="mt-3 border-t border-slate-100" />

      <ul
        className="mt-2 flex flex-wrap items-center justify-center gap-1.5"
        role="tablist"
        aria-label="Jira insights"
      >
        {insightsTabs.map((tab) => {
          const isActive = activeInsightsTab === tab.value;
          const TabIcon = tab.icon;
          return (
            <li key={tab.value} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleInsightsTabChange(tab.value)}
                className={`group inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-all ${
                  isActive
                    ? tab.value === 'health'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                      : tab.value === 'workload'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                        : tab.value === 'hierarchy'
                          ? 'border-cyan-200 bg-cyan-50 text-cyan-700 shadow-sm'
                          : 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded transition-colors ${
                    isActive
                      ? tab.value === 'health'
                        ? 'text-indigo-500'
                        : tab.value === 'workload'
                          ? 'text-emerald-500'
                          : tab.value === 'hierarchy'
                            ? 'text-cyan-500'
                            : 'text-amber-500'
                      : 'text-slate-400 group-hover:text-slate-500'
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
    </section>
  );

  if (!health || health.lastSyncedAt === null) {
    return (
      <div className="space-y-4">
        <RequestStateModal
          isOpen={jiraRefreshModal.isOpen}
          status={jiraRefreshModal.status}
          title={jiraRefreshModal.title}
          message={jiraRefreshModal.message}
          onClose={jiraRefreshModal.status === 'loading' ? undefined : closeJiraRefreshModal}
          onRetry={jiraRefreshModal.status === 'error' ? jiraRefreshModal.retryAction : undefined}
        />
        {contextHeader}
        {refreshError ? (
          <ErrorState
            error={refreshError}
            onRetry={canRefresh ? () => void performRefresh({ requestModal: false }) : undefined}
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
      <RequestStateModal
        isOpen={jiraRefreshModal.isOpen}
        status={jiraRefreshModal.status}
        title={jiraRefreshModal.title}
        message={jiraRefreshModal.message}
        onClose={jiraRefreshModal.status === 'loading' ? undefined : closeJiraRefreshModal}
        onRetry={jiraRefreshModal.status === 'error' ? jiraRefreshModal.retryAction : undefined}
      />
      {contextHeader}
      {refreshError ? (
        <ErrorState
          error={refreshError}
          onRetry={canRefresh ? () => void performRefresh({ requestModal: false }) : undefined}
        />
      ) : null}

      {activeInsightsTab === 'health' ? (
        <div className="space-y-4">
          <section
            id="jira-project-health"
            className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <KanbanSquare className="h-4 w-4" />
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
            className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
              <h2 className="text-base font-semibold tracking-wide text-slate-900">
                Quality signals
              </h2>
              <p className="text-sm text-slate-400">Open bug pressure over active issues</p>
            </div>
            <JiraBugRatioBar bugRatio={health.bugRatio} />
          </section>

          <section
            id="jira-distribution"
            className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
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
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
          <JiraSprintProgressSection fetcher={sprintFetcher} projectId={projectId} />
        </div>
      ) : null}

      {activeInsightsTab === 'workload' && workloadFetcher ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
          <JiraWorkloadPanel fetcher={workloadFetcher} projectId={projectId} />
        </div>
      ) : null}

      {activeInsightsTab === 'hierarchy' ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
          <JiraHierarchyView
            isLoading={isHierarchyLoading}
            error={hierarchyError}
            data={hierarchyData}
          />
        </div>
      ) : null}
    </div>
  );
}
