import type { ProjectGitHubPreview } from '@/features/projects/types';
import type { GitHubAvailableRepositories } from '@/features/shared/types/github.types';

export type {
  GitHubAccessSource,
  GitHubAccessType,
  GitHubAvailableRepositories,
  GitHubOwnerType,
  GitHubRepositoryOption,
  GitHubSyncStatus,
  LinkGitHubRepositoriesPayload,
  ProjectGitHubRepositories,
  ProjectRepositoryLink,
} from '@/features/shared/types/github.types';

export type ProjectGitHubActivity = ProjectGitHubPreview;

export type GitHubInstallationRepository = {
  repositoryId: number;
  name: string;
  fullName: string;
  url: string;
  ownerLogin: string;
  defaultBranch: string;
};

export type GitHubInstallationRepositoriesPage = {
  items: GitHubInstallationRepository[];
  page: number;
  size: number;
  returnedCount: number;
  totalCount: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage: number | null;
};

export type LinkProjectGitHubRepositoryRequest = {
  installationId: number;
  repositoryId: number;
};

export type ProjectGitHubRepositoryLink = {
  projectId: string;
  installationId: number;
  repositoryId: number;
  name: string;
  fullName: string;
  url: string;
  ownerLogin: string;
  defaultBranch: string;
  lastSyncedAt: string | null;
};

export type GitHubRepositoryAccessRequestCreate = {
  projectId: string;
  requestToken: string;
  requestUrl: string;
  expiresAt: string;
};

export type GitHubRepositoryAccessRequestValidation = {
  projectId: string;
  projectTitle: string;
  status: string;
  expiresAt: string;
};

export type GitHubRepositoryAccessRequestContinue = {
  projectId: string;
  githubAuthorizeUrl: string;
};

export type GitHubAccessUpdatedSummary = {
  projectId: string;
  projectTitle: string;
  installationId: number;
  sourceId?: string | null;
  flowType?: 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED' | null;
  accessScope: string;
  accessibleRepositoryCount: number;
  repositories: GitHubInstallationRepository[];
};

export type GitHubAccessUpdatedAcknowledge = {
  projectId: string;
};

export type GitHubInstallStart = {
  projectId: string;
  githubAuthorizeUrl: string;
  flowType: 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED';
  expiresAt: string;
};

export type GitHubAccessRequestCreateV2 = {
  projectId: string;
  requestUrl: string;
  expiresAt: string;
};

export type ProjectGitHubRepositoryListing = {
  projectId: string;
  inventory: GitHubAvailableRepositories[];
};
