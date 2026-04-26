import { useCallback, useEffect, useRef, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { supervisorApi } from '../../api/supervisorApi';
import { isApiException } from '@/services/apiClient';
import type { JiraWorkspaceOption } from '../../types';

const JIRA_COMPLETION_PROCESSING_TTL_MS = 5 * 60 * 1000;
const JIRA_RESULT_KEY_PREFIX = 'jira-oauth:';
const JIRA_OAUTH_COMPLETION_PARAM_KEYS = [
  'jiraResultKey',
  'jiraCode',
  'jiraState',
  'jiraError',
  'jiraErrorDescription',
] as const;

type RefreshModalControls = {
  showLoading: (payload: { title: string; message: string; retryAction?: () => void }) => void;
  showSuccess: (payload: {
    title: string;
    message: string;
    redirectToJiraOnClose?: boolean;
  }) => void;
  showError: (payload: { title: string; message: string; retryAction?: () => void }) => void;
  hide: () => void;
};

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

function hasJiraOAuthCompletionParams(searchParams: URLSearchParams): boolean {
  return JIRA_OAUTH_COMPLETION_PARAM_KEYS.some((key) => searchParams.has(key));
}

function navigateToWindowLocation(url: string): void {
  window.location.assign(url);
}

type JiraWorkspaceSelectionState = {
  isOpen: boolean;
  selectionToken: string | null;
  selectedCloudId: string | null;
  workspaceOptions: JiraWorkspaceOption[];
  processKey: string | null;
  doneKey: string | null;
};

type UseSupervisorProjectJiraFlowParams = {
  projectId: string | undefined;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  reloadProject: () => Promise<void>;
  refreshModal: RefreshModalControls;
  navigateToUrl?: (url: string) => void;
};

export function useSupervisorProjectJiraFlow({
  projectId,
  searchParams,
  setSearchParams,
  reloadProject,
  refreshModal,
  navigateToUrl = navigateToWindowLocation,
}: UseSupervisorProjectJiraFlowParams) {
  const [isConnectingJira, setIsConnectingJira] = useState(false);
  const [isDisconnectingJira, setIsDisconnectingJira] = useState(false);
  const [isJiraDisconnectConfirmOpen, setIsJiraDisconnectConfirmOpen] = useState(false);
  const [jiraWorkspaceSelection, setJiraWorkspaceSelection] = useState<JiraWorkspaceSelectionState>(
    {
      isOpen: false,
      selectionToken: null,
      selectedCloudId: null,
      workspaceOptions: [],
      processKey: null,
      doneKey: null,
    },
  );
  const jiraCompletionGuardRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasJiraOAuthCompletionParams(searchParams)) {
      return;
    }

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
      setIsConnectingJira(false);
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

    refreshModal.showLoading({
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

          refreshModal.hide();
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
        refreshModal.showSuccess({
          title: 'Jira connected',
          message: result.workspaceName
            ? `Jira workspace "${result.workspaceName}" was connected successfully.`
            : 'Jira workspace connected successfully.',
          redirectToJiraOnClose: true,
        });
        await reloadProject();
      } catch (error) {
        sessionStorage.removeItem(processKey);
        const message = isApiException(error)
          ? error.apiError.message
          : 'Jira authorization was not completed. Please try again.';
        refreshModal.showError({
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
  }, [reloadProject, refreshModal, searchParams, setSearchParams]);

  useEffect(() => {
    function handlePageShow() {
      if (!hasJiraOAuthCompletionParams(searchParams)) {
        setIsConnectingJira(false);
      }
    }

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [searchParams]);

  const hydrateJiraAfterConnect = useCallback(
    async (connectedProjectId: string | null | undefined) => {
      if (!connectedProjectId) {
        return;
      }
      try {
        await supervisorApi.refreshProjectJira(connectedProjectId);
      } catch {
        // Keep connect success UX even if immediate refresh fails; Jira tab retry still works.
      }
    },
    [],
  );

  const confirmJiraWorkspaceSelection = useCallback(async () => {
    if (!jiraWorkspaceSelection.selectionToken || !jiraWorkspaceSelection.selectedCloudId) {
      refreshModal.showError({
        title: 'Jira connection failed',
        message: 'Select a Jira workspace to continue.',
      });
      return;
    }

    refreshModal.showLoading({
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
      refreshModal.showSuccess({
        title: 'Jira connected',
        message: result.workspaceName
          ? `Jira workspace "${result.workspaceName}" was connected successfully.`
          : 'Jira workspace connected successfully.',
        redirectToJiraOnClose: true,
      });
      await reloadProject();
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Jira workspace selection was not completed. Please try again.';
      refreshModal.showError({
        title: 'Jira connection failed',
        message,
      });
    }
  }, [
    hydrateJiraAfterConnect,
    jiraWorkspaceSelection.doneKey,
    jiraWorkspaceSelection.processKey,
    jiraWorkspaceSelection.selectedCloudId,
    jiraWorkspaceSelection.selectionToken,
    projectId,
    refreshModal,
    reloadProject,
  ]);

  const cancelJiraWorkspaceSelection = useCallback(() => {
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
  }, [jiraWorkspaceSelection.processKey]);

  const handleConnectJira = useCallback(async () => {
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
      navigateToUrl(auth.url);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to start Jira connection right now.';
      refreshModal.showError({
        title: 'Jira connection failed',
        message,
      });
    } finally {
      if (!redirecting) {
        setIsConnectingJira(false);
      }
    }
  }, [navigateToUrl, projectId, refreshModal]);

  const handleDisconnectJira = useCallback((): Promise<void> => {
    setIsJiraDisconnectConfirmOpen(true);
    return Promise.resolve();
  }, []);

  const confirmDisconnectJira = useCallback(async () => {
    if (!projectId) return;
    setIsJiraDisconnectConfirmOpen(false);
    setIsDisconnectingJira(true);
    refreshModal.showLoading({
      title: 'Disconnecting Jira',
      message: 'Removing Jira workspace link from this project.',
    });
    try {
      await supervisorApi.disconnectProjectJira(projectId);
      await reloadProject();
      refreshModal.showSuccess({
        title: 'Jira disconnected',
        message: 'Jira workspace was disconnected from this project.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to disconnect Jira right now.';
      refreshModal.showError({
        title: 'Jira disconnect failed',
        message,
      });
    } finally {
      setIsDisconnectingJira(false);
    }
  }, [projectId, refreshModal, reloadProject]);

  return {
    isConnectingJira,
    isDisconnectingJira,
    isJiraDisconnectConfirmOpen,
    setIsJiraDisconnectConfirmOpen,
    jiraWorkspaceSelection,
    setJiraWorkspaceSelection,
    confirmJiraWorkspaceSelection,
    cancelJiraWorkspaceSelection,
    handleConnectJira,
    handleDisconnectJira,
    confirmDisconnectJira,
  };
}
