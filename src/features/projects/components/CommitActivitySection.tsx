import { useState } from 'react';
import type { ApiError } from '@/types';
import { buttonStyles } from '@/components/ui/Button';
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubPreview,
  ProjectGitHubRecentCommit,
} from '../types';
import { GithubDetailsModal } from './GithubDetailsModal';
import { GithubActivityModalContent } from './GithubActivityModalContent';
import { GithubContributorsModalContent } from './GithubContributorsModalContent';

type CommitActivitySectionProps = {
  isLoading: boolean;
  error: ApiError | null;
  data: ProjectGitHubPreview | null;
  onRetry: () => void;
  githubPageSize: number;
  loadActivityPage: (
    page: number,
    size: number,
  ) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;
  loadContributorsPage: (
    page: number,
    size: number,
  ) => Promise<PaginatedListResult<ProjectGitHubContributor>>;
  canRefresh: boolean;
  isRefreshing: boolean;
  onRefresh?: () => void;
  onNavigateToOverview?: () => void;
};

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not recorded';
  }

  return dateTimeFormatter.format(new Date(value));
}

function toDisplayStatus(value: 'active' | 'idle') {
  return value === 'active' ? 'Active' : 'Idle';
}

type CommitType =
  | 'merge'
  | 'feat'
  | 'fix'
  | 'refactor'
  | 'chore'
  | 'docs'
  | 'ci'
  | 'test'
  | 'perf'
  | 'build'
  | 'revert'
  | 'style';

function getCommitType(message: string): CommitType | null {
  const subject =
    message
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0)
      ?.toLowerCase() ?? '';

  if (
    /^merge(\s|$)/.test(subject) ||
    subject.includes('merge pull request') ||
    subject.includes('merge branch')
  ) {
    return 'merge';
  }

  const conventionalType = subject.match(/^([a-z]+)(?:\([^)]+\))?!?:\s*/)?.[1] ?? null;
  if (conventionalType) {
    const normalizedType = conventionalType.toLowerCase();
    const typeAliasMap: Record<string, CommitType> = {
      feat: 'feat',
      feature: 'feat',
      fix: 'fix',
      bugfix: 'fix',
      hotfix: 'fix',
      refactor: 'refactor',
      chore: 'chore',
      docs: 'docs',
      doc: 'docs',
      ci: 'ci',
      test: 'test',
      perf: 'perf',
      build: 'build',
      revert: 'revert',
      style: 'style',
    };
    if (typeAliasMap[normalizedType]) {
      return typeAliasMap[normalizedType];
    }
  }

  const fallbackPatterns: Array<[CommitType, RegExp]> = [
    ['feat', /^(feat|feature)\b/],
    ['fix', /^(fix|bugfix|hotfix)\b/],
    ['refactor', /^refactor\b/],
    ['docs', /^(docs|doc)\b/],
    ['chore', /^chore\b/],
    ['ci', /^(ci|pipeline|workflow)\b/],
    ['test', /^test\b/],
    ['perf', /^perf\b/],
    ['build', /^build\b/],
    ['revert', /^revert\b/],
    ['style', /^style\b/],
  ];
  for (const [type, pattern] of fallbackPatterns) {
    if (pattern.test(subject)) {
      return type;
    }
  }
  return null;
}

function commitTypeBadgeClass(type: CommitType) {
  if (type === 'merge') {
    return 'bg-slate-200 text-slate-700';
  }
  if (type === 'feat') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (type === 'fix') {
    return 'bg-sky-100 text-sky-700';
  }
  if (type === 'refactor') {
    return 'bg-violet-100 text-violet-700';
  }
  if (type === 'ci' || type === 'build') {
    return 'bg-cyan-100 text-cyan-700';
  }
  if (type === 'docs') {
    return 'bg-amber-100 text-amber-700';
  }
  if (type === 'test') {
    return 'bg-fuchsia-100 text-fuchsia-700';
  }
  if (type === 'perf') {
    return 'bg-teal-100 text-teal-700';
  }
  if (type === 'revert') {
    return 'bg-rose-100 text-rose-700';
  }
  if (type === 'style') {
    return 'bg-lime-100 text-lime-700';
  }
  return 'bg-zinc-100 text-zinc-700';
}

function renderCommitCard(commit: ProjectGitHubRecentCommit, index: number) {
  const type = getCommitType(commit.message);
  const shortSha = commit.sha ? commit.sha.slice(0, 7) : null;

  return (
    <article
      key={`${commit.sha ?? 'commit'}-${index}`}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <p
          className="text-sm font-medium text-foreground break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden"
          title={commit.message || 'No message'}
        >
          {commit.message || 'No message'}
        </p>
        {type ? (
          <span
            className={`justify-self-end self-start whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${commitTypeBadgeClass(type)}`}
          >
            {type}
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="min-w-0">
          <p className="uppercase tracking-[0.16em] text-[10px] text-slate-500">Author</p>
          <p className="truncate text-slate-700" title={commit.author || 'Unknown'}>
            {commit.author || 'Unknown'}
          </p>
        </div>
        <div>
          <p className="uppercase tracking-[0.16em] text-[10px] text-slate-500">Time</p>
          <p className="truncate text-slate-700">{formatDateTime(commit.committedAt)}</p>
        </div>
        <div>
          <p className="uppercase tracking-[0.16em] text-[10px] text-slate-500">SHA</p>
          <p className="font-mono text-slate-700">{shortSha ?? 'N/A'}</p>
        </div>
      </div>
    </article>
  );
}

type LegacyCommitPayload = {
  repositoryLinked?: boolean;
  repository?: {
    name?: string;
    url?: string;
    defaultBranch?: string;
  } | null;
  repositories?: Array<{
    id?: string | null;
    name?: string;
    url?: string;
    defaultBranch?: string;
    lastSyncedAt?: string | null;
  }>;
  contributorsPreview?: Array<{ name: string; commitCount: number }>;
  recentCommitsPreview?: ProjectGitHubRecentCommit[];
  activitySummary?: {
    totalCommits?: number;
    lastActivityAt?: string | null;
    status?: string;
  };
  commits?: Array<{
    sha?: string | null;
    message?: string;
    author?: string;
    committedAt?: string | null;
  }>;
  contributors?: Array<{ name: string; commitCount: number }>;
  recentCommits?: ProjectGitHubRecentCommit[];
};

function normalizeDashboardPayload(
  raw: ProjectGitHubPreview | LegacyCommitPayload,
): ProjectGitHubPreview {
  const maybeDashboard = raw as ProjectGitHubPreview;
  if (
    maybeDashboard &&
    typeof maybeDashboard === 'object' &&
    'activitySummary' in maybeDashboard &&
    'contributorsPreview' in maybeDashboard &&
    'recentCommitsPreview' in maybeDashboard
  ) {
    return {
      repositoryLinked: Boolean(maybeDashboard.repositoryLinked),
      repositories: Array.isArray(maybeDashboard.repositories) ? maybeDashboard.repositories : [],
      activitySummary: {
        totalCommits: Number(maybeDashboard.activitySummary?.totalCommits ?? 0),
        lastActivityAt: maybeDashboard.activitySummary?.lastActivityAt ?? null,
        status: maybeDashboard.activitySummary?.status === 'active' ? 'active' : 'idle',
      },
      contributorsPreview: Array.isArray(maybeDashboard.contributorsPreview)
        ? maybeDashboard.contributorsPreview
        : [],
      recentCommitsPreview: Array.isArray(maybeDashboard.recentCommitsPreview)
        ? maybeDashboard.recentCommitsPreview
        : [],
    };
  }

  const legacy = raw as LegacyCommitPayload;
  const commits = Array.isArray(legacy.commits) ? legacy.commits : [];
  const normalizedCommits: ProjectGitHubRecentCommit[] = commits.map((commit) => ({
    sha: commit.sha ?? null,
    message: commit.message ?? '',
    author: commit.author ?? 'Unknown',
    committedAt: commit.committedAt ?? null,
  }));

  return {
    repositoryLinked: Boolean(legacy.repositoryLinked),
    repositories: Array.isArray(legacy.repositories)
      ? legacy.repositories.map((repository) => ({
          id: repository.id ?? null,
          name: repository.name ?? 'Repository',
          url: repository.url ?? '',
          defaultBranch: repository.defaultBranch ?? 'main',
          lastSyncedAt: repository.lastSyncedAt ?? null,
        }))
      : legacy.repository
        ? [
            {
              id: null,
              name: legacy.repository.name ?? 'Repository',
              url: legacy.repository.url ?? '',
              defaultBranch: legacy.repository.defaultBranch ?? 'main',
              lastSyncedAt: null,
            },
          ]
        : [],
    activitySummary: {
      totalCommits: Number(legacy.activitySummary?.totalCommits ?? normalizedCommits.length),
      lastActivityAt:
        legacy.activitySummary?.lastActivityAt ?? normalizedCommits[0]?.committedAt ?? null,
      status:
        legacy.activitySummary?.status === 'active' || legacy.activitySummary?.status === 'idle'
          ? legacy.activitySummary.status
          : normalizedCommits.length > 0
            ? 'active'
            : 'idle',
    },
    contributorsPreview: Array.isArray(legacy.contributorsPreview)
      ? legacy.contributorsPreview
      : Array.isArray(legacy.contributors)
        ? legacy.contributors
        : [],
    recentCommitsPreview: Array.isArray(legacy.recentCommitsPreview)
      ? legacy.recentCommitsPreview
      : Array.isArray(legacy.recentCommits)
        ? legacy.recentCommits
        : normalizedCommits,
  };
}

export function CommitActivitySection({
  isLoading,
  error,
  data,
  onRetry,
  githubPageSize,
  loadActivityPage,
  loadContributorsPage,
  canRefresh,
  isRefreshing,
  onRefresh,
  onNavigateToOverview,
}: CommitActivitySectionProps) {
  const [openModal, setOpenModal] = useState<'activity' | 'contributors' | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Repository Overview</h2>
          <div className="mt-4 animate-pulse space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-1/4 rounded bg-slate-200" />
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`summary-loading-${index}`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-700">GitHub dashboard unavailable</h2>
        <p className="mt-2 text-sm text-rose-700">
          {error.message || 'Unable to load GitHub dashboard right now.'}
        </p>
        <button
          type="button"
          className={buttonStyles({ variant: 'secondary', size: 'sm', className: 'mt-4' })}
          onClick={onRetry}
        >
          Retry
        </button>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const normalized = normalizeDashboardPayload(data);
  const repositoryItems = normalized.repositoryLinked ? normalized.repositories.slice(0, 1) : [];
  const hasLinkedRepository = repositoryItems.length > 0;
  const topContributors = normalized.contributorsPreview.slice(0, 4);
  const recentCommits = normalized.recentCommitsPreview.slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Repository Overview</h2>
          {canRefresh && hasLinkedRepository ? (
            <button
              type="button"
              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          ) : null}
        </div>
        {repositoryItems.length > 0 ? (
          <div className="mt-4 space-y-3">
            {repositoryItems.map((repository) => (
              <article
                key={repository.url}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-medium text-foreground">{repository.name}</p>
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-sm text-primary hover:underline"
                >
                  {repository.url}
                </a>
                <p className="mt-2 text-xs text-muted-foreground">
                  Default branch: {repository.defaultBranch || 'main'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last synced: {formatDateTime(repository.lastSyncedAt)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">No repository connected.</p>
            <p className="text-sm text-muted-foreground">
              Link a repository to start tracking GitHub activity.
            </p>
            {onNavigateToOverview ? (
              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                onClick={onNavigateToOverview}
              >
                Go to Overview
              </button>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Activity Summary</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Total commits
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {normalized.activitySummary.totalCommits}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Last activity
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {formatDateTime(normalized.activitySummary.lastActivityAt)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Status
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {toDisplayStatus(normalized.activitySummary.status)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Contributors Preview</h2>
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => setOpenModal('contributors')}
          >
            View all contributors →
          </button>
        </div>
        {topContributors.length > 0 ? (
          <div className="mt-4 space-y-3">
            {topContributors.map((contributor) => (
              <article
                key={contributor.name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-medium text-foreground">{contributor.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {contributor.commitCount} commit{contributor.commitCount === 1 ? '' : 's'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No contributor activity yet.</p>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Activity Feed</h2>
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => setOpenModal('activity')}
          >
            View full activity →
          </button>
        </div>
        {recentCommits.length > 0 ? (
          <div className="mt-4 space-y-3">{recentCommits.map(renderCommitCard)}</div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No recent activity found.</p>
        )}
      </section>

      <GithubDetailsModal
        isOpen={openModal === 'contributors'}
        title="GitHub Contributors"
        onClose={() => setOpenModal(null)}
      >
        <GithubContributorsModalContent
          isOpen={openModal === 'contributors'}
          pageSize={githubPageSize}
          fetchPage={loadContributorsPage}
        />
      </GithubDetailsModal>

      <GithubDetailsModal
        isOpen={openModal === 'activity'}
        title="GitHub Activity"
        onClose={() => setOpenModal(null)}
      >
        <GithubActivityModalContent
          isOpen={openModal === 'activity'}
          pageSize={githubPageSize}
          fetchPage={loadActivityPage}
        />
      </GithubDetailsModal>
    </div>
  );
}
