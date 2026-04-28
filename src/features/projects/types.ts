export type ProjectGitHubRepositoryPreview = {
  id: string | null;
  name: string;
  url: string;
  defaultBranch: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type ProjectGitHubActivitySummary = {
  totalCommits: number;
  lastActivityAt: string | null;
  status: 'active' | 'idle';
};

export type ProjectGitHubContributor = {
  name: string;
  commitCount: number;
  githubUsername?: string | null;
  avatarUrl?: string | null;
};

export type ProjectGitHubRecentCommit = {
  sha: string | null;
  message: string;
  author: string;
  githubUsername?: string | null;
  avatarUrl?: string | null;
  committedAt: string | null;
  type?: string | null;
};

export type ProjectGitHubPreview = {
  repositoryLinked: boolean;
  authorizedInstallationId?: number | null;
  accessibleRepositoryCount?: number | null;
  accessScope?:
    | 'NOT_AUTHORIZED'
    | 'NO_REPOSITORIES'
    | 'SINGLE_REPOSITORY'
    | 'MULTIPLE_REPOSITORIES'
    | 'ACCESS_UNAVAILABLE'
    | string
    | null;
  repositories: ProjectGitHubRepositoryPreview[];
  primaryRepositoryUrl?: string | null;
  activitySummary: ProjectGitHubActivitySummary;
  contributorsPreview: ProjectGitHubContributor[];
  recentCommitsPreview: ProjectGitHubRecentCommit[];
  hasUnacknowledgedAccess?: boolean;
};

export type PaginatedListResult<T> = {
  items: T[];
  hasMore: boolean;
  page: number;
  size: number;
  total?: number;
};
