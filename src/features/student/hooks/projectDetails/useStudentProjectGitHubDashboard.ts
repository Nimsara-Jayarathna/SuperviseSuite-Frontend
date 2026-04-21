import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeSyncStatus } from '@/lib/syncStatus';
import type { CanonicalSyncStatus } from '@/lib/syncStatus';
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubRecentCommit,
} from '@/features/projects/types';
import type {
  ProjectGitHubRepositories,
  ProjectRepositoryLink,
} from '@/features/shared/types/github.types';
import type { ProjectGitHubActivity } from '../../types';

type FetchProjectGitHubDashboard = (
  projectId: string,
  forceRefresh?: boolean,
  linkedRepositoryId?: string | null,
) => Promise<ProjectGitHubActivity>;

type FetchActivityPage = (
  projectId: string,
  page: number,
  linkedRepositoryId?: string | null,
) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;

type FetchContributorsPage = (
  projectId: string,
  page: number,
  linkedRepositoryId?: string | null,
) => Promise<PaginatedListResult<ProjectGitHubContributor>>;

type UseStudentProjectGitHubDashboardParams = {
  projectId: string | undefined;
  projectGithubView: ProjectGitHubActivity | null;
  githubRepositories: ProjectGitHubRepositories | null | undefined;
  fetchDashboard: FetchProjectGitHubDashboard;
  fetchActivityPage: FetchActivityPage;
  fetchContributorsPage: FetchContributorsPage;
};

type UseStudentProjectGitHubDashboardResult = {
  enabledRepositories: ProjectRepositoryLink[];
  selectedRepoId: string | null;
  isRepoSelectorOpen: boolean;
  setRepoSelectorOpen: (open: boolean) => void;
  activeRepository: ProjectRepositoryLink | null;
  activeRepositorySyncStatus: CanonicalSyncStatus;
  githubView: ProjectGitHubActivity | null;
  isGitHubViewLoading: boolean;
  selectRepository: (linkedRepositoryId: string) => Promise<void>;
  loadActivityPage: (page: number) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;
  loadContributorsPage: (page: number) => Promise<PaginatedListResult<ProjectGitHubContributor>>;
};

export function useStudentProjectGitHubDashboard({
  projectId,
  projectGithubView,
  githubRepositories,
  fetchDashboard,
  fetchActivityPage,
  fetchContributorsPage,
}: UseStudentProjectGitHubDashboardParams): UseStudentProjectGitHubDashboardResult {
  const [isRepoSelectorOpen, setRepoSelectorOpen] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [githubView, setGithubView] = useState<ProjectGitHubActivity | null>(projectGithubView);
  const [isGitHubViewLoading, setIsGitHubViewLoading] = useState(false);

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
        const nextView = await fetchDashboard(projectId, false, linkedRepositoryId);
        setGithubView(nextView);
      } finally {
        setIsGitHubViewLoading(false);
      }
    },
    [projectId, fetchDashboard],
  );

  const loadActivityPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }

      return fetchActivityPage(projectId, page, selectedRepoId);
    },
    [projectId, fetchActivityPage, selectedRepoId],
  );

  const loadContributorsPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }

      return fetchContributorsPage(projectId, page, selectedRepoId);
    },
    [projectId, fetchContributorsPage, selectedRepoId],
  );

  return {
    enabledRepositories,
    selectedRepoId,
    isRepoSelectorOpen,
    setRepoSelectorOpen,
    activeRepository,
    activeRepositorySyncStatus,
    githubView,
    isGitHubViewLoading,
    selectRepository,
    loadActivityPage,
    loadContributorsPage,
  };
}
