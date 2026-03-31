import { CalendarDays, Clock3, Users, ChevronDown, Check, Github } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { CommitActivitySection } from '@/features/projects/components/CommitActivitySection';
import { ProjectDetailsSkeleton } from '../components/ProjectDetailsSkeleton';
import { IntegrationsTabSection } from '../components/ProjectDetail/IntegrationsTabSection';
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
import type {
  ProjectGitHubActivity,
  SupervisorProjectDetailTab,
  SupervisorProjectLifecycle,
} from '../types';

const JIRA_COMPLETION_PROCESSING_TTL_MS = 5 * 60 * 1000;

function hashFlowKey(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
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
  const [isGitHubViewLoading, setIsGitHubViewLoading] = useState(false);
  const [pendingGitHubSourceId, setPendingGitHubSourceId] = useState<string | null>(null);
  const [pendingGitHubFlowType, setPendingGitHubFlowType] = useState<
    'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED' | null
  >(null);
  const [selectedGitHubRepositoryLinkId, setSelectedGitHubRepositoryLinkId] = useState<
    string | null
  >(null);
  const [githubView, setGithubView] = useState<ProjectGitHubActivity | null>(
    loadedProject?.github ?? null,
  );
  const handlePendingGitHubSourceHandled = useCallback(() => {
    setPendingGitHubSourceId(null);
    setPendingGitHubFlowType(null);
  }, []);
  const { data: projectRepositories } = useProjectRepositories(projectId);
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
  const [isConnectingJira, setIsConnectingJira] = useState(false);
  const [isDisconnectingJira, setIsDisconnectingJira] = useState(false);
  const [isJiraDisconnectConfirmOpen, setIsJiraDisconnectConfirmOpen] = useState(false);
  const jiraCompletionGuardRef = useRef<string | null>(null);

  const activeRepository = useMemo(() => {
    return (
      projectRepositories?.repositories.find((r) => r.id === selectedGitHubRepositoryLinkId) ?? null
    );
  }, [projectRepositories, selectedGitHubRepositoryLinkId]);

  const loadActivityPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubActivityPage(
        projectId,
        page,
        selectedGitHubRepositoryLinkId,
      );
    },
    [projectId, selectedGitHubRepositoryLinkId],
  );
  const loadContributorsPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubContributorsPage(
        projectId,
        page,
        selectedGitHubRepositoryLinkId,
      );
    },
    [projectId, selectedGitHubRepositoryLinkId],
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
      if (selectedGitHubRepositoryLinkId) {
        const refreshedView = await supervisorApi.getProjectGitHubDashboard(
          projectId,
          true,
          selectedGitHubRepositoryLinkId,
        );
        setGithubView(refreshedView);
      }
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
    const jiraCode = searchParams.get('jiraCode');
    const jiraState = searchParams.get('jiraState');
    const jiraError = searchParams.get('jiraError');
    const jiraErrorDescription = searchParams.get('jiraErrorDescription');
    if (!jiraCode && !jiraState && !jiraError && !jiraErrorDescription) {
      return;
    }

    const flowKey = `${jiraCode ?? ''}:${jiraState ?? ''}:${jiraError ?? ''}:${jiraErrorDescription ?? ''}`;
    if (jiraCompletionGuardRef.current === flowKey) {
      return;
    }
    jiraCompletionGuardRef.current = flowKey;
    const flowStorageId = hashFlowKey(flowKey);

    const processKey = `jira-complete:${flowStorageId}:processing`;
    const doneKey = `jira-complete:${flowStorageId}:done`;
    if (sessionStorage.getItem(doneKey) === 'true') {
      return;
    }

    const existingProcessing = sessionStorage.getItem(processKey);
    if (existingProcessing) {
      const startedAt = Number(existingProcessing);
      if (
        !Number.isNaN(startedAt) &&
        Date.now() - startedAt < JIRA_COMPLETION_PROCESSING_TTL_MS
      ) {
        return;
      }
      sessionStorage.removeItem(processKey);
    }
    sessionStorage.setItem(processKey, String(Date.now()));

    setRefreshRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Connecting Jira',
      message: 'Finalizing Jira workspace authorization.',
    });

    (async () => {
      try {
        const result = await supervisorApi.completeJiraOAuth({
          code: jiraCode,
          state: jiraState,
          error: jiraError,
          errorDescription: jiraErrorDescription,
        });
        sessionStorage.setItem(doneKey, 'true');
        sessionStorage.removeItem(processKey);
        setRefreshRequestModal({
          isOpen: true,
          status: 'success',
          title: 'Jira connected',
          message: result.workspaceName
            ? `Jira workspace "${result.workspaceName}" was connected successfully.`
            : 'Jira workspace connected successfully.',
        });
        await reload();
      } catch (error) {
        sessionStorage.removeItem(processKey);
        const message = isApiException(error)
          ? error.apiError.message
          : 'Jira authorization was not completed. Please try again.';
        setRefreshRequestModal({
          isOpen: true,
          status: 'error',
          title: 'Jira connection failed',
          message,
        });
      } finally {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('jiraCode');
        nextParams.delete('jiraState');
        nextParams.delete('jiraError');
        nextParams.delete('jiraErrorDescription');
        setSearchParams(nextParams, { replace: true });
      }
    })();
  }, [reload, searchParams, setSearchParams]);

  useEffect(() => {
    setGithubView(project?.github ?? null);
  }, [project?.github]);

  useEffect(() => {
    const primaryLink =
      projectRepositories?.repositories.find((repository) => repository.primary) ??
      projectRepositories?.repositories[0] ??
      null;
    setSelectedGitHubRepositoryLinkId(primaryLink?.id ?? null);
  }, [projectRepositories?.repositories]);

  async function handleSelectGitHubRepository(linkedRepositoryId: string) {
    if (!projectId) {
      setSelectedGitHubRepositoryLinkId(linkedRepositoryId);
      return;
    }
    setSelectedGitHubRepositoryLinkId(linkedRepositoryId);
    setIsGitHubViewLoading(true);
    try {
      const nextView = await supervisorApi.getProjectGitHubDashboard(
        projectId,
        false,
        linkedRepositoryId,
      );
      setGithubView(nextView);
    } finally {
      setIsGitHubViewLoading(false);
    }
  }

  async function handleConnectJira() {
    if (!projectId) return;
    setIsConnectingJira(true);
    try {
      const auth = await supervisorApi.getProjectJiraAuthUrl(projectId);
      if (!auth.url?.trim()) {
        throw new Error('Missing Jira authorization URL.');
      }
      window.location.assign(auth.url);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to start Jira connection right now.';
      setRefreshRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Jira connection failed',
        message,
      });
    } finally {
      setIsConnectingJira(false);
    }
  }

  async function handleDisconnectJira() {
    setIsJiraDisconnectConfirmOpen(true);
  }

  async function confirmDisconnectJira() {
    if (!projectId) return;
    setIsJiraDisconnectConfirmOpen(false);
    setIsDisconnectingJira(true);
    setRefreshRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Disconnecting Jira',
      message: 'Removing Jira workspace link from this project.',
    });
    try {
      await supervisorApi.disconnectProjectJira(projectId);
      await reload();
      setRefreshRequestModal({
        isOpen: true,
        status: 'success',
        title: 'Jira disconnected',
        message: 'Jira workspace was disconnected from this project.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to disconnect Jira right now.';
      setRefreshRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Jira disconnect failed',
        message,
      });
    } finally {
      setIsDisconnectingJira(false);
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
      <RequestStateModal
        isOpen={isJiraDisconnectConfirmOpen}
        status="warning"
        title="Disconnect Jira workspace?"
        message="This project will stop receiving Jira-linked data until you connect again."
        onClose={() => setIsJiraDisconnectConfirmOpen(false)}
        autoCloseOnSuccess={false}
        footer={
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsJiraDisconnectConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={() => void confirmDisconnectJira()}
            >
              Disconnect
            </Button>
          </div>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Milestone
              </span>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Team
              </span>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Progress
              </span>
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
        <OverviewTabSection project={project} overview={overview} />
      ) : null}

      {activeTab === 'team' ? <TeamTabSection project={project} team={team} /> : null}

      {activeTab === 'milestones' ? (
        <MilestonesTabSection project={project} milestones={milestones} />
      ) : null}

      {activeTab === 'github' ? (
        <div className="space-y-4">
          {projectRepositories &&
          projectRepositories.repositories.length > 0 &&
          activeRepository ? (
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
                          {activeRepository.customName?.trim() ||
                            activeRepository.fullName ||
                            activeRepository.name ||
                            'Set a repository'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${isRepoSelectorOpen ? 'rotate-180' : ''}`}
                      />
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
                                      <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}
                                      >
                                        <Github className="h-4 w-4" />
                                      </div>
                                      <div className="flex min-w-0 flex-col">
                                        <span className="truncate font-bold tracking-tight">
                                          {repo.customName?.trim() ||
                                            repo.name ||
                                            'Unnamed Repository'}
                                        </span>
                                        <span className="truncate text-[10px] text-slate-400">
                                          {repo.fullName}
                                        </span>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <Check className="h-4 w-4 shrink-0 text-amber-600" />
                                    )}
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
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Sync Status
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${activeRepository.syncStatus === 'SUCCESS' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}
                      />
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
            isLoading={isLoading || isGitHubViewLoading}
            error={null}
            data={githubView}
            onRetry={() => void reload()}
            loadActivityPage={loadActivityPage}
            loadContributorsPage={loadContributorsPage}
            canRefresh
            isRefreshing={isRefreshingGitHub}
            onRefresh={() => void handleGitHubRefresh()}
            onNavigateToOverview={() => handleTabChange('integrations')}
          />
        </div>
      ) : null}

      {activeTab === 'jira' ? (
        project.jira?.connected ? (
          <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Jira tab moved</h2>
            <p className="mt-3 text-sm text-slate-600">
              Jira integration settings are available under the Integrations tab.
            </p>
          </section>
        ) : (
          <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">No Jira workspace connected</h2>
            <p className="mt-3 text-sm text-slate-600">
              Connect Jira from Integrations to enable workspace linking and project-level Jira
              visibility.
            </p>
            <div className="mt-5">
              <button
                type="button"
                className={buttonStyles({ variant: 'primary', size: 'sm' })}
                onClick={() => handleTabChange('integrations')}
              >
                Go to Integrations
              </button>
            </div>
          </section>
        )
      ) : null}

      {activeTab === 'integrations' ? (
        <IntegrationsTabSection
          project={project}
          onProjectUpdate={actions.handleProjectUpdate}
          onConnectJira={handleConnectJira}
          onDisconnectJira={handleDisconnectJira}
          isConnectingJira={isConnectingJira}
          isDisconnectingJira={isDisconnectingJira}
          pendingGitHubSourceId={pendingGitHubSourceId}
          pendingGitHubFlowType={pendingGitHubFlowType}
          onPendingGitHubSourceHandled={handlePendingGitHubSourceHandled}
        />
      ) : null}
    </div>
  );
}
