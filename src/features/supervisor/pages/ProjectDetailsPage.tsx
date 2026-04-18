import {
  CalendarDays,
  Clock3,
  Users,
  ChevronDown,
  Check,
  Github,
  ExternalLink,
  GitBranch,
  RefreshCw,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { PageTabs } from '@/components/ui/PageTabs';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { Select } from '@/components/ui/Select';
import { LastSyncedBadge } from '@/components/ui/LastSyncedBadge';
import { SyncStatusBadge } from '@/components/ui/SyncStatusBadge';
import { normalizeSyncStatus } from '@/lib/syncStatus';
import { CommitActivitySection } from '@/features/projects/components/CommitActivitySection';
import { ProjectDetailsSkeleton } from '../components/ProjectDetailsSkeleton';
import { IntegrationsTabSection } from '../components/ProjectDetail/IntegrationsTabSection';
import { JiraTabSection } from '../components/ProjectDetail/JiraTabSection';
import { MilestonesTabSection } from '../components/ProjectDetail/MilestonesTabSection';
import { OverviewTabSection } from '../components/ProjectDetail/OverviewTabSection';
import { TeamTabSection } from '../components/ProjectDetail/TeamTabSection';
import { FilesTabSection } from '../components/ProjectDetail/FilesTabSection';
import { MeetingsTabSection } from '../components/ProjectDetail/MeetingsTabSection';
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
  JiraWorkspaceOption,
  SupervisorProjectDetailTab,
  SupervisorProjectLifecycle,
} from '../types';

const JIRA_COMPLETION_PROCESSING_TTL_MS = 5 * 60 * 1000;
const JIRA_RESULT_KEY_PREFIX = 'jira-oauth:';

function hashFlowKey(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function readJiraOAuthResultFromStorage(rawKey: string | null): {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  errorDescription?: string | null;
} | null {
  if (!rawKey || !rawKey.startsWith(JIRA_RESULT_KEY_PREFIX)) {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(rawKey);
    sessionStorage.removeItem(rawKey);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const payload = parsed as Record<string, unknown>;
    return {
      code: typeof payload.code === 'string' ? payload.code : null,
      state: typeof payload.state === 'string' ? payload.state : null,
      error: typeof payload.error === 'string' ? payload.error : null,
      errorDescription:
        typeof payload.errorDescription === 'string' ? payload.errorDescription : null,
    };
  } catch {
    return null;
  }
}

function isValidJiraAuthUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return host === 'auth.atlassian.com' || host.endsWith('.atlassian.com');
  } catch {
    return false;
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
    redirectToJiraOnClose?: boolean;
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
  const [jiraWorkspaceSelection, setJiraWorkspaceSelection] = useState<{
    isOpen: boolean;
    selectionToken: string | null;
    selectedCloudId: string | null;
    workspaceOptions: JiraWorkspaceOption[];
    processKey: string | null;
    doneKey: string | null;
  }>({
    isOpen: false,
    selectionToken: null,
    selectedCloudId: null,
    workspaceOptions: [],
    processKey: null,
    doneKey: null,
  });
  const jiraCompletionGuardRef = useRef<string | null>(null);

  const enabledRepositories = useMemo(
    () => projectRepositories?.repositories.filter((repository) => repository.enabled) ?? [],
    [projectRepositories?.repositories],
  );
  const activeRepository = useMemo(
    () =>
      enabledRepositories.find((repository) => repository.id === selectedGitHubRepositoryLinkId) ??
      null,
    [enabledRepositories, selectedGitHubRepositoryLinkId],
  );
  const activeRepositorySyncStatus = normalizeSyncStatus(activeRepository?.syncStatus);

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
    setRefreshRequestModal((current) => {
      if (current.redirectToJiraOnClose) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'jira');
        setSearchParams(nextParams, { replace: true });
      }
      return { ...current, isOpen: false, redirectToJiraOnClose: false };
    });
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
    const jiraResultKey = searchParams.get('jiraResultKey');
    const storedPayload = readJiraOAuthResultFromStorage(jiraResultKey);
    const jiraCode = storedPayload?.code ?? searchParams.get('jiraCode');
    const jiraState = storedPayload?.state ?? searchParams.get('jiraState');
    const jiraError = storedPayload?.error ?? searchParams.get('jiraError');
    const jiraErrorDescription =
      storedPayload?.errorDescription ?? searchParams.get('jiraErrorDescription');
    if (!jiraCode && !jiraState && !jiraError && !jiraErrorDescription) {
      if (jiraResultKey) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('jiraResultKey');
        setSearchParams(nextParams, { replace: true });
      }
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
      if (!Number.isNaN(startedAt) && Date.now() - startedAt < JIRA_COMPLETION_PROCESSING_TTL_MS) {
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

        if (result.requiresWorkspaceSelection) {
          if (!result.selectionToken || result.workspaceOptions.length === 0) {
            throw new Error('Workspace selection details were not returned by the server.');
          }

          setRefreshRequestModal((current) => ({ ...current, isOpen: false }));
          setJiraWorkspaceSelection({
            isOpen: true,
            selectionToken: result.selectionToken,
            selectedCloudId: result.workspaceOptions[0]?.cloudId ?? null,
            workspaceOptions: result.workspaceOptions,
            processKey,
            doneKey,
          });
          return;
        }

        sessionStorage.setItem(doneKey, 'true');
        sessionStorage.removeItem(processKey);
        setRefreshRequestModal({
          isOpen: true,
          status: 'success',
          title: 'Jira connected',
          message: result.workspaceName
            ? `Jira workspace "${result.workspaceName}" was connected successfully.`
            : 'Jira workspace connected successfully.',
          redirectToJiraOnClose: true,
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
        nextParams.delete('jiraResultKey');
        nextParams.delete('jiraCode');
        nextParams.delete('jiraState');
        nextParams.delete('jiraError');
        nextParams.delete('jiraErrorDescription');
        setSearchParams(nextParams, { replace: true });
      }
    })();
  }, [reload, searchParams, setSearchParams]);

  async function hydrateJiraAfterConnect(connectedProjectId: string | null | undefined) {
    if (!connectedProjectId) {
      return;
    }
    try {
      await supervisorApi.refreshProjectJira(connectedProjectId);
    } catch {
      // Keep connect success UX even if immediate refresh fails; Jira tab retry still works.
    }
  }

  async function confirmJiraWorkspaceSelection() {
    if (!jiraWorkspaceSelection.selectionToken || !jiraWorkspaceSelection.selectedCloudId) {
      setRefreshRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Jira connection failed',
        message: 'Select a Jira workspace to continue.',
      });
      return;
    }

    setRefreshRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Connecting Jira',
      message: 'Finalizing Jira workspace selection.',
    });

    try {
      const result = await supervisorApi.completeJiraOAuth({
        selectionToken: jiraWorkspaceSelection.selectionToken,
        selectedCloudId: jiraWorkspaceSelection.selectedCloudId,
      });
      if (jiraWorkspaceSelection.doneKey) {
        sessionStorage.setItem(jiraWorkspaceSelection.doneKey, 'true');
      }
      if (jiraWorkspaceSelection.processKey) {
        sessionStorage.removeItem(jiraWorkspaceSelection.processKey);
      }
      setJiraWorkspaceSelection({
        isOpen: false,
        selectionToken: null,
        selectedCloudId: null,
        workspaceOptions: [],
        processKey: null,
        doneKey: null,
      });
      await hydrateJiraAfterConnect(result.projectId || projectId);
      setRefreshRequestModal({
        isOpen: true,
        status: 'success',
        title: 'Jira connected',
        message: result.workspaceName
          ? `Jira workspace "${result.workspaceName}" was connected successfully.`
          : 'Jira workspace connected successfully.',
        redirectToJiraOnClose: true,
      });
      await reload();
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Jira workspace selection was not completed. Please try again.';
      setRefreshRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Jira connection failed',
        message,
      });
    }
  }

  function cancelJiraWorkspaceSelection() {
    if (jiraWorkspaceSelection.processKey) {
      sessionStorage.removeItem(jiraWorkspaceSelection.processKey);
    }
    setJiraWorkspaceSelection({
      isOpen: false,
      selectionToken: null,
      selectedCloudId: null,
      workspaceOptions: [],
      processKey: null,
      doneKey: null,
    });
  }

  useEffect(() => {
    setGithubView(project?.github ?? null);
  }, [project?.github]);

  useEffect(() => {
    const primaryLink =
      enabledRepositories.find((repository) => repository.primary) ??
      enabledRepositories[0] ??
      null;
    setSelectedGitHubRepositoryLinkId(primaryLink?.id ?? null);
  }, [enabledRepositories]);

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
    let redirecting = false;
    try {
      const auth = await supervisorApi.getProjectJiraAuthUrl(projectId);
      if (!auth.url?.trim()) {
        throw new Error('Missing Jira authorization URL.');
      }
      if (!isValidJiraAuthUrl(auth.url)) {
        throw new Error('Invalid Jira authorization URL.');
      }
      redirecting = true;
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
      if (!redirecting) {
        setIsConnectingJira(false);
      }
    }
  }

  function handleDisconnectJira(): Promise<void> {
    setIsJiraDisconnectConfirmOpen(true);
    return Promise.resolve();
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
        autoCloseOnSuccess={!refreshRequestModal.redirectToJiraOnClose}
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
      <RequestStateModal
        isOpen={jiraWorkspaceSelection.isOpen}
        status="warning"
        title="Select Jira workspace"
        message="Multiple Jira workspaces are available for this account. Choose one to connect this project."
        onClose={cancelJiraWorkspaceSelection}
        autoCloseOnSuccess={false}
        content={
          <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-left">
            {jiraWorkspaceSelection.workspaceOptions.map((option) => (
              <label
                key={option.cloudId}
                className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="jira-workspace-option"
                  className="mt-1"
                  checked={jiraWorkspaceSelection.selectedCloudId === option.cloudId}
                  onChange={() =>
                    setJiraWorkspaceSelection((current) => ({
                      ...current,
                      selectedCloudId: option.cloudId,
                    }))
                  }
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {option.workspaceName}
                  </span>
                  {option.workspaceUrl ? (
                    <span className="block truncate text-xs text-slate-600">
                      {option.workspaceUrl}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        }
        footer={
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={cancelJiraWorkspaceSelection}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => void confirmJiraWorkspaceSelection()}
            >
              Connect selected workspace
            </Button>
          </div>
        }
      />

      <section className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {project.title}
          </h1>
          <p
            className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.summary ?? 'No summary has been recorded for this project yet.'}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Lifecycle
            </span>
            <div className="mt-0.5">
              <Select
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
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
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

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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

      {activeTab === 'files' ? (
        <FilesTabSection projectId={project.id} initialFiles={project.files} />
      ) : null}

      {activeTab === 'meetings' ? <MeetingsTabSection projectId={project.id} /> : null}

      {activeTab === 'github' ? (
        <div className="space-y-4">
          {enabledRepositories.length > 0 && activeRepository ? (
            <section className="relative z-20">
              <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:flex-row">
                {/* Left: icon + full repo identity */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Github className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Active repository
                    </span>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0">
                      <span className="text-[15px] font-bold leading-tight text-slate-900">
                        {activeRepository.customName?.trim() ||
                          activeRepository.name ||
                          'Unnamed repository'}
                      </span>
                      {activeRepository.url && (
                        <a
                          href={activeRepository.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-amber-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Visit
                        </a>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {activeRepository.fullName && (
                        <span className="text-[11px] text-slate-400">
                          {activeRepository.fullName}
                        </span>
                      )}
                      {activeRepository.defaultBranch && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <GitBranch className="h-3 w-3 text-indigo-400" />
                          {activeRepository.defaultBranch}
                        </span>
                      )}
                      {activeRepository.lastSyncedAt &&
                        activeRepositorySyncStatus === 'SUCCESS' && (
                          <LastSyncedBadge
                            lastSyncedAt={activeRepository.lastSyncedAt}
                            className="bg-transparent p-0 text-[11px] text-slate-400"
                            iconClassName="h-3 w-3 text-emerald-400"
                          />
                        )}
                      <SyncStatusBadge syncStatus={activeRepositorySyncStatus} mode="health" />
                    </div>
                  </div>
                </div>

                {/* Right: Refresh + Switch */}
                <div className="flex w-full shrink-0 items-center gap-2 pt-0.5 sm:w-auto">
                  <button
                    type="button"
                    aria-label={isRefreshingGitHub ? 'Refreshing' : 'Refresh GitHub data'}
                    className={buttonStyles({
                      variant: 'secondary',
                      size: 'sm',
                      className: 'w-9 px-0',
                    })}
                    onClick={() => void handleGitHubRefresh()}
                    disabled={isRefreshingGitHub}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isRefreshingGitHub ? 'animate-spin' : ''}`}
                    />
                  </button>

                  {enabledRepositories.length > 1 && (
                    <div className="min-w-0 flex-1 sm:hidden">
                      <Select
                        value={selectedGitHubRepositoryLinkId ?? ''}
                        onChange={(e) => {
                          void handleSelectGitHubRepository(e.target.value);
                        }}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-amber-300 focus:ring-4 focus:ring-amber-50"
                        aria-label="Switch repository"
                      >
                        {enabledRepositories.map((repo) => (
                          <option key={repo.id} value={repo.id}>
                            {repo.customName?.trim() || repo.name || 'Unnamed repository'}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {enabledRepositories.length > 1 && (
                    <div className="relative hidden sm:block">
                      <button
                        type="button"
                        onClick={() => setIsRepoSelectorOpen(!isRepoSelectorOpen)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                      >
                        Switch
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isRepoSelectorOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isRepoSelectorOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsRepoSelectorOpen(false)}
                          />
                          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 sm:left-auto sm:right-0 sm:min-w-[280px]">
                            {enabledRepositories.map((repo) => {
                              const isSelected = repo.id === selectedGitHubRepositoryLinkId;
                              return (
                                <button
                                  key={repo.id}
                                  type="button"
                                  onClick={() => {
                                    void handleSelectGitHubRepository(repo.id);
                                    setIsRepoSelectorOpen(false);
                                  }}
                                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-all hover:bg-amber-50 ${
                                    isSelected ? 'bg-amber-50/60' : 'bg-white'
                                  }`}
                                >
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                      isSelected
                                        ? 'bg-amber-100 text-amber-600'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    <Github className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span
                                      className={`block truncate text-[13px] font-bold ${
                                        isSelected ? 'text-amber-800' : 'text-slate-800'
                                      }`}
                                    >
                                      {repo.customName?.trim() || repo.name || 'Unnamed repository'}
                                    </span>
                                    <span className="block truncate text-[11px] text-slate-400">
                                      {repo.fullName}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <Check className="h-4 w-4 shrink-0 text-amber-500" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
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
            onNavigateToOverview={() => handleTabChange('integrations')}
          />
        </div>
      ) : null}

      {activeTab === 'jira' ? <JiraTabSection project={project} /> : null}

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
