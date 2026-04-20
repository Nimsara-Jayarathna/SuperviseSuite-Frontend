import type { ProjectGitHubPreview } from '@/features/projects/types';

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

export type GitHubAccessType = 'PUBLIC_URL' | 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED';
export type GitHubOwnerType = 'USER' | 'ORG';
export type GitHubSyncStatus = 'IN_PROGRESS' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'DISABLED';

export type GitHubAccessSource = {
  id: string;
  projectId: string;
  installationId: number | null;
  ownerLogin: string;
  ownerType: GitHubOwnerType;
  accessType: GitHubAccessType;
  active: boolean;
  createdAt: string;
};

export type GitHubRepositoryOption = {
  id: string;
  githubRepoId: number;
  fullName: string;
  name: string;
  ownerLogin: string;
  defaultBranch: string | null;
  url: string;
};

export type GitHubAvailableRepositories = {
  sourceId: string;
  items: GitHubRepositoryOption[];
  totalCount: number;
};

export type LinkGitHubRepositoriesPayload = {
  projectId: string;
  sourceId: string;
  repositories: Array<{
    githubRepositoryId: string;
    customName?: string | null;
    primary?: boolean;
  }>;
};

export type ProjectRepositoryLink = {
  id: string;
  sourceId: string | null;
  accessType?: GitHubAccessType | string | null;
  githubRepositoryId: string | null;
  githubRepoId: number;
  fullName: string | null;
  name: string | null;
  customName: string | null;
  ownerLogin: string | null;
  defaultBranch: string | null;
  url: string | null;
  primary: boolean;
  enabled: boolean;
  linkedAt: string;
  lastSyncedAt: string | null;
  syncStatus: GitHubSyncStatus | null;
};

export type ProjectGitHubRepositories = {
  projectId: string;
  maxLinkedRepositories: number;
  maxEnabledRepositories: number;
  accessSources: GitHubAccessSource[];
  repositories: ProjectRepositoryLink[];
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
