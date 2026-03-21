export type ProjectGitHubRepositoryPreview = {
  id: string | null;
  name: string;
  url: string;
  defaultBranch: string;
  lastSyncedAt: string | null;
};

export type ProjectGitHubActivitySummary = {
  totalCommits: number;
  lastActivityAt: string | null;
  status: 'active' | 'idle';
};

export type ProjectGitHubContributor = {
  name: string;
  commitCount: number;
};

export type ProjectGitHubRecentCommit = {
  sha: string | null;
  message: string;
  author: string;
  committedAt: string | null;
  type?: string | null;
};

export type ProjectGitHubPreview = {
  repositoryLinked: boolean;
  repositories: ProjectGitHubRepositoryPreview[];
  activitySummary: ProjectGitHubActivitySummary;
  contributorsPreview: ProjectGitHubContributor[];
  recentCommitsPreview: ProjectGitHubRecentCommit[];
};

export type PaginatedListResult<T> = {
  items: T[];
  hasMore: boolean;
  page: number;
  size: number;
  total?: number;
};
