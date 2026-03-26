import {
  CalendarDays,
  Clock3,
  Users,
  ChevronDown,
  Check,
  Github,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CommitActivitySection } from '@/features/projects/components/CommitActivitySection';
import { ProjectDetailsSkeleton } from '../components/ProjectDetailsSkeleton';
import { MilestonesTabSection } from '../components/ProjectDetail/MilestonesTabSection';
import { OverviewTabSection } from '../components/ProjectDetail/OverviewTabSection';
import { TeamTabSection } from '../components/ProjectDetail/TeamTabSection';
import { useProjectRepositories } from '../hooks/useProjectRepositories';
import { parseGitHubSetupRedirect } from '../hooks/useGitHubSetupFlow';
import { useProjectDetailsPageState } from '../hooks/useProjectDetailsPageState';
import { useSupervisorProject } from '../hooks/useSupervisorProject';
import { supervisorApi } from '../api/supervisorApi';
import { isApiException } from '@/services/apiClient';
import {
  LIFECYCLE_OPTIONS,
  TABS,
  dateFormatter,
  dateTimeFormatter,
  toTabLabel,
} from '../projectDetails.shared';
import type { SupervisorProjectDetailTab, SupervisorProjectLifecycle } from '../types';

function getLifecycleTone(status: SupervisorProjectLifecycle): any {
  switch (status) {
    case 'PLANNING':
      return 'student';
    case 'ACTIVE':
      return 'success';
    case 'AT_RISK':
      return 'warning';
    case 'BEHIND':
      return 'danger';
    case 'COMPLETED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project: loadedProject, isLoading, error, reload } = useSupervisorProject(projectId);
  const { project, overview, team, milestones, requestModal, actions } = useProjectDetailsPageState(
    {
      projectId,
      loadedProject,
    },
  );
  const [isRefreshingGitHub, setIsRefreshingGitHub] = useState(false);
  const [pendingGitHubSourceId, setPendingGitHubSourceId] = useState<string | null>(null);
  const [pendingGitHubFlowType, setPendingGitHubFlowType] = useState<
    'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED' | null
  >(null);
  const [selectedGitHubRepositoryLinkId, setSelectedGitHubRepositoryLinkId] = useState<
    string | null
  >(null);
  const handlePendingGitHubSourceHandled = useCallback(() => {
    setPendingGitHubSourceId(null);
    setPendingGitHubFlowType(null);
  }, []);
  const { data: projectRepositories, reload: reloadProjectRepositories } =
    useProjectRepositories(projectId);
  const [refreshRequestModal, setRefreshRequestModal] = useState<{
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

  const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false);

  const activeRepository = useMemo(() => {
    return projectRepositories?.repositories.find((r) => r.id === selectedGitHubRepositoryLinkId) ?? null;
  }, [projectRepositories, selectedGitHubRepositoryLinkId]);

  const loadActivityPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubActivityPage(projectId, page);
    },
    [projectId],
  );
  const loadContributorsPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubContributorsPage(projectId, page);
    },
    [projectId],
  );

  async function handleGitHubRefresh() {
    if (!projectId) {
      return;
    }

    setIsRefreshingGitHub(true);
    setRefreshRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Refreshing GitHub data',
      message: 'Syncing latest repository metadata, commits, and contributors.',
      retryAction: () => void handleGitHubRefresh(),
    });
    try {
      await supervisorApi.refreshProjectGitHub(projectId);
      await reload();
      setRefreshRequestModal({
        isOpen: true,
        status: 'success',
        title: 'GitHub data refreshed',
        message: 'Latest GitHub data was synced and loaded successfully.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to refresh GitHub data right now. Please try again.';
      setRefreshRequestModal({
        isOpen: true,
        status: 'error',
        title: 'GitHub refresh failed',
        message,
      });
    } finally {
      setIsRefreshingGitHub(false);
    }
  }

  function closeRefreshRequestModal() {
    setRefreshRequestModal((current) => ({ ...current, isOpen: false }));
  }

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const redirectState = parseGitHubSetupRedirect(searchParams);
    if (!redirectState.setupStatus) {
      return;
    }

    if (redirectState.setupStatus === 'success') {
      if (redirectState.sourceId) {
        setPendingGitHubSourceId(redirectState.sourceId);
        setPendingGitHubFlowType(redirectState.flowType);
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('githubSetup');
      nextParams.delete('installationId');
      nextParams.delete('githubSourceId');
      nextParams.delete('githubFlow');
      nextParams.delete('githubAccessUpdated');
      nextParams.delete('tab');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    if (redirectState.setupStatus === 'failed') {
      setRefreshRequestModal({
        isOpen: true,
        status: 'error',
        title: 'GitHub setup failed',
        message: 'GitHub App connection did not complete. Please try connecting again.',
      });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('githubSetup');
      nextParams.delete('installationId');
      nextParams.delete('githubSourceId');
      nextParams.delete('githubFlow');
      nextParams.delete('githubAccessUpdated');
      setSearchParams(nextParams, { replace: true });
    }
  }, [projectId, searchParams, setSearchParams]);

  useEffect(() => {
    const primaryLink =
      projectRepositories?.repositories.find((repository) => repository.primary) ??
      projectRepositories?.repositories[0] ??
      null;
    setSelectedGitHubRepositoryLinkId(primaryLink?.id ?? null);
  }, [projectRepositories?.repositories]);

  async function handleSelectGitHubRepository(linkedRepositoryId: string) {
    if (!projectId) {
      return;
    }

    setIsRefreshingGitHub(true);
    setRefreshRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Switching repository',
      message: 'Updating primary repository and loading repository-level GitHub analytics.',
      retryAction: () => void handleSelectGitHubRepository(linkedRepositoryId),
    });

    try {
      await supervisorApi.selectPrimaryGitHubRepository(linkedRepositoryId);
      await Promise.all([reload(), reloadProjectRepositories()]);
      setSelectedGitHubRepositoryLinkId(linkedRepositoryId);
      setRefreshRequestModal({
        isOpen: true,
        status: 'success',
        title: 'Repository selected',
        message: 'GitHub tab now reflects the selected repository.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to switch repository right now.';
      setRefreshRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Repository switch failed',
        message,
      });
    } finally {
      setIsRefreshingGitHub(false);
    }
  }

  const requestedTab = searchParams.get('tab') as SupervisorProjectDetailTab | null;
  const activeTab = requestedTab && TABS.includes(requestedTab) ? requestedTab : 'overview';

  function handleTabChange(tab: SupervisorProjectDetailTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }
    setSearchParams(nextParams, { replace: true });
  }

  if (isLoading) return <ProjectDetailsSkeleton />;

  if (error) {
    if (error.code === 'NOT_FOUND') {
      return (
        <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Project not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested supervisor project could not be found or is not available to your account.
          </p>
          <Link
            to="/supervisor/projects"
            className={buttonStyles({ variant: 'primary', size: 'md', className: 'mt-6' })}
          >
            Back to projects
          </Link>
        </div>
      );
    }
    return <ErrorState error={error} onRetry={() => void reload()} />;
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <RequestStateModal
        isOpen={requestModal.state.isOpen}
        status={requestModal.state.status}
        title={requestModal.state.title}
        message={requestModal.state.message}
        onClose={requestModal.state.status === 'loading' ? undefined : requestModal.close}
        onRetry={requestModal.state.status === 'error' ? requestModal.retryLastRequest : undefined}
      />
      <RequestStateModal
        isOpen={refreshRequestModal.isOpen}
        status={refreshRequestModal.status}
        title={refreshRequestModal.title}
        message={refreshRequestModal.message}
        onClose={refreshRequestModal.status === 'loading' ? undefined : closeRefreshRequestModal}
        onRetry={
          refreshRequestModal.status === 'error' ? refreshRequestModal.retryAction : undefined
        }
      />

      <PageHeader
        title={project.title}
        subtitle={project.summary ?? 'No summary has been recorded for this project yet.'}
      />

      <section className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Lifecycle
            </span>
            <div className="mt-0.5">
              <select
                value={actions.quickLifecycleStatus}
                onChange={(e) =>
                  actions.handleQuickStatusChange(e.target.value as SupervisorProjectLifecycle)
                }
                disabled={actions.isUpdatingStatus}
                className="bg-transparent text-[13px] font-black uppercase tracking-tight text-foreground outline-none cursor-pointer"
              >
                {LIFECYCLE_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Milestone</span>
              <span className="font-semibold text-slate-700">
                {project.milestoneDate
                  ? dateFormatter.format(new Date(project.milestoneDate))
                  : 'Not set'}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Team</span>
              <span className="font-semibold text-slate-700">
                {project.members.length} member{project.members.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock3 className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</span>
              <span className="font-semibold text-slate-700">{project.progressPercent ?? 0}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Batch', value: project.batch ?? 'Not set' },
          { label: 'Semester', value: project.semester ?? 'Not set' },
          { label: 'Milestones', value: String(project.milestones.length) },
          {
            label: 'Last Activity',
            value: project.lastActivityAt
              ? dateTimeFormatter.format(new Date(project.lastActivityAt))
              : 'Not recorded',
            small: true,
          },
        ].map(({ label, value, small }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <p className={`mt-2 font-semibold text-foreground ${small ? 'text-sm' : 'text-2xl'}`}>
              {value}
            </p>
          </div>
        ))}
      </section>

      <PageTabs
        items={TABS.map((tab) => ({ value: tab, label: toTabLabel(tab) }))}
        value={activeTab}
        onChange={(value) => handleTabChange(value as SupervisorProjectDetailTab)}
        tone="supervisor"
      />

      {activeTab === 'overview' ? (
        <OverviewTabSection
          project={project}
          overview={overview}
          onProjectUpdate={actions.handleProjectUpdate}
          pendingGitHubSourceId={pendingGitHubSourceId}
          pendingGitHubFlowType={pendingGitHubFlowType}
          onPendingGitHubSourceHandled={handlePendingGitHubSourceHandled}
        />
      ) : null}

      {activeTab === 'team' ? <TeamTabSection project={project} team={team} /> : null}

      {activeTab === 'milestones' ? (
        <MilestonesTabSection project={project} milestones={milestones} />
      ) : null}

      {activeTab === 'github' ? (
        <div className="space-y-4">
          {projectRepositories && projectRepositories.repositories.length > 0 && activeRepository ? (
            <section className="relative z-20">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Active Repository
                  </span>
                  <div className="relative mt-1">
                    <button
                      type="button"
                      onClick={() => setIsRepoSelectorOpen(!isRepoSelectorOpen)}
                      className="flex w-full items-center justify-between gap-2 text-left transition-colors hover:text-amber-600"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Github className="h-4 w-4" />
                        </div>
                        <span className="truncate font-bold text-slate-800">
                          {activeRepository.customName?.trim() || activeRepository.fullName || activeRepository.name || 'Set a repository'}
                        </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${isRepoSelectorOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isRepoSelectorOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsRepoSelectorOpen(false)} 
                        />
                        <div className="absolute left-0 top-full z-20 mt-2 w-full min-w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="max-h-[300px] overflow-y-auto">
                            {projectRepositories.repositories
                              .filter((repo) => repo.enabled)
                              .map((repo) => {
                                const isSelected = repo.id === selectedGitHubRepositoryLinkId;
                              return (
                                <button
                                  key={repo.id}
                                  type="button"
                                  onClick={() => {
                                    void handleSelectGitHubRepository(repo.id);
                                    setIsRepoSelectorOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all hover:bg-amber-50 ${isSelected ? 'bg-amber-50/50 text-amber-700' : 'text-slate-600 hover:text-amber-700'}`}
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                                      <Github className="h-4 w-4" />
                                    </div>
                                    <div className="flex min-w-0 flex-col">
                                      <span className="truncate font-bold tracking-tight">
                                        {repo.customName?.trim() || repo.name || 'Unnamed Repository'}
                                      </span>
                                      <span className="truncate text-[10px] text-slate-400">
                                        {repo.fullName}
                                      </span>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 shrink-0 text-amber-600" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="hidden shrink-0 items-center gap-3 sm:flex">
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sync Status</span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${activeRepository.syncStatus === 'SUCCESS' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                      <span className="text-xs font-bold text-slate-600">
                        {activeRepository.syncStatus === 'SUCCESS' ? 'Healthy' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <CommitActivitySection
            isLoading={isLoading}
            error={null}
            data={project.github}
            onRetry={() => void reload()}
            loadActivityPage={loadActivityPage}
            loadContributorsPage={loadContributorsPage}
            canRefresh
            isRefreshing={isRefreshingGitHub}
            onRefresh={() => void handleGitHubRefresh()}
            onNavigateToOverview={() => handleTabChange('overview')}
          />
        </div>
      ) : null}
    </div>
  );
}
