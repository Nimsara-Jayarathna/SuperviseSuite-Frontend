export type ProjectGitHubRepository = {
  name: string;
  url: string;
  defaultBranch: string;
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
};

export type ProjectGitHubDashboard = {
  repositoryLinked: boolean;
  repository: ProjectGitHubRepository | null;
  activitySummary: ProjectGitHubActivitySummary;
  contributors: ProjectGitHubContributor[];
  recentCommits: ProjectGitHubRecentCommit[];
};
