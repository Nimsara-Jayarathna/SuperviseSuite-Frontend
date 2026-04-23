import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeSyncStatus } from '@/lib/syncStatus';
import type { CanonicalSyncStatus } from '@/lib/syncStatus';
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubRecentCommit,
} from '@/features/projects/types';
import type { ProjectRepositoryLink } from '@/features/shared/types/github.types';
import { supervisorApi } from '../../api/supervisorApi';
import type { ProjectGitHubActivity, ProjectGitHubRepositories } from '../../types';
import { isApiException } from '@/services/apiClient';

type RefreshModalControls = {
  showLoading: (payload: { title: string; message: string; retryAction?: () => void }) => void;
  showSuccess: (payload: {
    title: string;
    message: string;
    redirectToJiraOnClose?: boolean;
  }) => void;
  showError: (payload: { title: string; message: string; retryAction?: () => void }) => void;
};

type UseSupervisorProjectGitHubDashboardParams = {
  projectId: string | undefined;
  isActive: boolean;
  projectGithubView: ProjectGitHubActivity | null;
  githubRepositories: ProjectGitHubRepositories | null | undefined;
  reloadRepositories: () => Promise<ProjectGitHubRepositories | null>;
  reloadProject: () => Promise<void>;
  refreshModal: RefreshModalControls;
};

type UseSupervisorProjectGitHubDashboardResult = {
  enabledRepositories: ProjectRepositoryLink[];
  selectedRepoId: string | null;
  activeRepository: ProjectRepositoryLink | null;
  activeRepositorySyncStatus: CanonicalSyncStatus;
  githubView: ProjectGitHubActivity | null;
  isGitHubViewLoading: boolean;
  isRefreshingGitHub: boolean;
  isRepoSelectorOpen: boolean;
  setIsRepoSelectorOpen: (open: boolean) => void;
  refreshGitHub: () => Promise<void>;
  selectRepository: (linkedRepositoryId: string) => Promise<void>;
  loadActivityPage: (page: number) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;
  loadContributorsPage: (page: number) => Promise<PaginatedListResult<ProjectGitHubContributor>>;
};

export function useSupervisorProjectGitHubDashboard({
  projectId,
  isActive,
  projectGithubView,
  githubRepositories,
  reloadRepositories,
  reloadProject,
  refreshModal,
}: UseSupervisorProjectGitHubDashboardParams): UseSupervisorProjectGitHubDashboardResult {
  const [isRefreshingGitHub, setIsRefreshingGitHub] = useState(false);
  const [isGitHubViewLoading, setIsGitHubViewLoading] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [githubView, setGithubView] = useState<ProjectGitHubActivity | null>(projectGithubView);
  const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const enabledRepositories = useMemo(
    () => githubRepositories?.repositories?.filter((repository) => repository.enabled) ?? [],
    [githubRepositories?.repositories],
  );

  const activeRepository = useMemo(
    () => enabledRepositories.find((repository) => repository.id === selectedRepoId) ?? null,
    [enabledRepositories, selectedRepoId],
  );

  const activeRepositorySyncStatus = normalizeSyncStatus(activeRepository?.syncStatus);

  useEffect(() => {
    if (enabledRepositories.length === 0) {
      setSelectedRepoId(null);
      setGithubView(null);
      setIsRepoSelectorOpen(false);
    }
  }, [enabledRepositories.length]);

  useEffect(() => {
    if (!projectId) return;
    if (!isActive) return;
    if (activeRepositorySyncStatus !== 'IN_PROGRESS' && activeRepositorySyncStatus !== 'PENDING') {
      return;
    }

    const intervalId = window.setInterval(() => {
      void reloadRepositories();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeRepositorySyncStatus, isActive, projectId, reloadRepositories]);

  useEffect(() => {
    setGithubView(projectGithubView ?? null);
  }, [projectGithubView]);

  useEffect(() => {
    const primaryLink =
      enabledRepositories.find((repository) => repository.primary) ??
      enabledRepositories[0] ??
      null;
    setSelectedRepoId(primaryLink?.id ?? null);
  }, [enabledRepositories]);

  const selectRepository = useCallback(
    async (linkedRepositoryId: string) => {
      if (!projectId) {
        setSelectedRepoId(linkedRepositoryId);
        return;
      }

      setSelectedRepoId(linkedRepositoryId);
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
    },
    [projectId],
  );

  const loadActivityPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubActivityPage(projectId, page, selectedRepoId);
    },
    [projectId, selectedRepoId],
  );

  const loadContributorsPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubContributorsPage(projectId, page, selectedRepoId);
    },
    [projectId, selectedRepoId],
  );

  const refreshGitHub = useCallback(async () => {
    if (!projectId) {
      return;
    }

    setIsRefreshingGitHub(true);
    refreshModal.showLoading({
      title: 'Refreshing GitHub data',
      message: 'Syncing latest repository metadata, commits, and contributors.',
      retryAction: () => void refreshGitHub(),
    });

    try {
      await supervisorApi.refreshProjectGitHub(projectId);
      await Promise.all([reloadProject(), reloadRepositories()]);

      const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
      const shouldPollStatus = Boolean(selectedRepoId);
      if (shouldPollStatus && selectedRepoId) {
        const maxAttempts = 30;
        let finalStatus: CanonicalSyncStatus = 'UNKNOWN';
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          const latestRepos = await reloadRepositories();
          const active =
            latestRepos?.repositories?.find((repo) => repo.id === selectedRepoId) ?? null;
          finalStatus = normalizeSyncStatus(active?.syncStatus);
          if (finalStatus !== 'IN_PROGRESS' && finalStatus !== 'PENDING') {
            break;
          }
          await delay(2000);
        }

        const refreshedView = await supervisorApi.getProjectGitHubDashboard(
          projectId,
          true,
          selectedRepoId,
        );
        if (isMountedRef.current) {
          setGithubView(refreshedView);
        }

        if (finalStatus === 'SUCCESS') {
          refreshModal.showSuccess({
            title: 'GitHub data refreshed',
            message: 'Latest GitHub data was synced and loaded successfully.',
          });
        } else if (finalStatus === 'FAILED') {
          refreshModal.showError({
            title: 'GitHub sync failed',
            message: 'GitHub sync failed. Try refreshing again in a moment.',
          });
        } else {
          refreshModal.showSuccess({
            title: 'GitHub refresh started',
            message: 'Repository sync is running and this page will update automatically.',
          });
        }
        return;
      }

      refreshModal.showSuccess({
        title: 'GitHub refresh started',
        message: 'Repository sync is running and this page will update automatically.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to refresh GitHub data right now. Please try again.';
      refreshModal.showError({
        title: 'GitHub refresh failed',
        message,
      });
    } finally {
      setIsRefreshingGitHub(false);
    }
  }, [projectId, refreshModal, reloadProject, reloadRepositories, selectedRepoId]);

  return {
    enabledRepositories,
    selectedRepoId,
    activeRepository,
    activeRepositorySyncStatus,
    githubView,
    isGitHubViewLoading,
    isRefreshingGitHub,
    isRepoSelectorOpen,
    setIsRepoSelectorOpen,
    refreshGitHub,
    selectRepository,
    loadActivityPage,
    loadContributorsPage,
  };
}
