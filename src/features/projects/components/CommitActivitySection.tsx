import { useState } from 'react';
import {
  Users,
  GitCommit,
  Clock,
  Activity,
  Github,
  ChevronRight,
  GitMerge,
  Terminal,
  FileText,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { ApiError } from '@/types';
import { buttonStyles } from '@/components/ui/Button';
import { TimeAgo } from '@/components/ui/TimeAgo';
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubPreview,
  ProjectGitHubRecentCommit,
} from '../types';
import { GithubDetailsModal } from './GithubDetailsModal';
import { GithubActivityModalContent } from './GithubActivityModalContent';
import { GithubContributorsModalContent } from './GithubContributorsModalContent';
import { getGeneratedAvatarUrl, getGitHubAvatarUrl } from '../utils/githubIdentity';

type CommitActivitySectionProps = {
  isLoading: boolean;
  error: ApiError | null;
  data: ProjectGitHubPreview | null;
  onRetry: () => void;
  loadActivityPage: (page: number) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;
  loadContributorsPage: (page: number) => Promise<PaginatedListResult<ProjectGitHubContributor>>;
  onNavigateToOverview?: () => void;
  emptyStateDescription?: string;
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
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }
  if (type === 'feat') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  if (type === 'fix') {
    return 'bg-rose-50 text-rose-700 border-rose-100';
  }
  if (type === 'refactor') {
    return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  }
  if (type === 'ci' || type === 'build') {
    return 'bg-cyan-50 text-cyan-700 border-cyan-100';
  }
  if (type === 'docs') {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  if (type === 'test') {
    return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100';
  }
  if (type === 'perf') {
    return 'bg-teal-50 text-teal-700 border-teal-100';
  }
  if (type === 'revert') {
    return 'bg-rose-50 text-rose-700 border-rose-100';
  }
  if (type === 'style') {
    return 'bg-lime-50 text-lime-700 border-lime-100';
  }
  return 'bg-zinc-50 text-zinc-600 border-zinc-100';
}

function CommitTypeIcon({ type, className }: { type: CommitType | null; className?: string }) {
  if (type === 'merge') return <GitMerge className={className} />;
  if (type === 'feat') return <Zap className={className} />;
  if (type === 'fix') return <ShieldCheck className={className} />;
  if (type === 'refactor') return <Settings className={className} />;
  if (type === 'ci' || type === 'build') return <Terminal className={className} />;
  if (type === 'docs') return <FileText className={className} />;
  return <GitCommit className={className} />;
}

function renderCommitCard(commit: ProjectGitHubRecentCommit, index: number) {
  const type = getCommitType(commit.message);
  const shortSha = commit.sha ? commit.sha.slice(0, 7) : null;
  const authorAvatarUrl = getGitHubAvatarUrl({
    name: commit.author,
    githubUsername: commit.githubUsername,
    avatarUrl: commit.avatarUrl,
  });

  return (
    <article
      key={`${commit.sha ?? 'commit'}-${index}`}
      className="group relative flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-amber-200 hover:shadow-md"
    >
      <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50 transition-transform group-hover:scale-110">
          {authorAvatarUrl ? (
            <img
              src={authorAvatarUrl}
              alt={commit.author || 'Author'}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getGeneratedAvatarUrl(commit.author);
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
              {commit.author?.slice(0, 2).toUpperCase() || '??'}
            </div>
          )}
        </div>
        <div className="min-h-8 flex-1 w-px bg-slate-100 group-last:hidden" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {commit.author || 'Unknown Author'}
            </span>
            <span className="text-slate-300">•</span>
            {commit.committedAt && (
              <TimeAgo date={commit.committedAt} className="text-xs font-medium text-slate-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {type && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${commitTypeBadgeClass(type)}`}
              >
                <CommitTypeIcon type={type} className="h-3 w-3" />
                {type}
              </span>
            )}
            <code className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700">
              {shortSha ?? 'N/A'}
            </code>
          </div>
        </div>

        <p className="mt-1.5 text-sm leading-6 text-slate-600 transition-colors group-hover:text-slate-900">
          {commit.message || 'No commit message provided.'}
        </p>
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
  contributorsPreview?: Array<ProjectGitHubContributor>;
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
    githubUsername?: string | null;
    avatarUrl?: string | null;
  }>;
  contributors?: Array<ProjectGitHubContributor>;
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
    githubUsername: commit.githubUsername ?? null,
    avatarUrl: commit.avatarUrl ?? null,
    committedAt: commit.committedAt ?? null,
  }));

  return {
    repositoryLinked: Boolean(legacy.repositoryLinked),
    repositories: Array.isArray(legacy.repositories)
      ? legacy.repositories.map((repository) => ({
          id: repository.id ?? null,
          name: repository.name ?? 'Repository',
          url: repository.url ?? '',
          defaultBranch: repository.defaultBranch ?? 'unknown',
          lastSyncedAt: repository.lastSyncedAt ?? null,
          createdAt: new Date(0).toISOString(),
          updatedAt: null,
        }))
      : legacy.repository
        ? [
            {
              id: null,
              name: legacy.repository.name ?? 'Repository',
              url: legacy.repository.url ?? '',
              defaultBranch: legacy.repository.defaultBranch ?? 'unknown',
              lastSyncedAt: null,
              createdAt: new Date(0).toISOString(),
              updatedAt: null,
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
  loadActivityPage,
  loadContributorsPage,
  onNavigateToOverview,
  emptyStateDescription,
}: CommitActivitySectionProps) {
  const [openModal, setOpenModal] = useState<'activity' | 'contributors' | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
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
  const hasLinkedRepository = normalized.repositoryLinked && normalized.repositories.length > 0;

  if (!hasLinkedRepository) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <Github className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="mt-6 text-lg font-bold text-slate-800">No repository connected</h3>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
          {emptyStateDescription ||
            'Connect a GitHub repository to this project to start tracking commits, activity, and contributor data.'}
        </p>
        {onNavigateToOverview && (
          <button
            type="button"
            className={buttonStyles({
              variant: 'primary',
              size: 'sm',
              className: 'mt-6 rounded-xl hover:shadow-lg transition-all',
            })}
            onClick={onNavigateToOverview}
          >
            Link a Repository
          </button>
        )}
      </div>
    );
  }

  const topContributors = normalized.contributorsPreview.slice(0, 4);
  const recentCommits = normalized.recentCommitsPreview.slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-indigo-50/50" />
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <GitCommit className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                Total commits
              </p>
              <p className="mt-1 text-3xl font-black text-slate-800">
                {normalized.activitySummary.totalCommits}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-amber-50/50" />
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                Last activity
              </p>
              <div className="mt-1">
                {normalized.activitySummary.lastActivityAt ? (
                  <div className="flex flex-col">
                    <TimeAgo
                      date={normalized.activitySummary.lastActivityAt}
                      className="text-lg font-black text-slate-800"
                    />
                    <span className="text-[10px] font-medium text-slate-400">
                      {formatDateTime(normalized.activitySummary.lastActivityAt)}
                    </span>
                  </div>
                ) : (
                  <p className="text-lg font-black text-slate-800">None</p>
                )}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-emerald-50/50" />
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Activity className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                Sync Status
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-3xl font-black text-slate-800">
                  {toDisplayStatus(normalized.activitySummary.status)}
                </p>
                <div
                  className={`h-2.5 w-2.5 rounded-full ${normalized.activitySummary.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Users className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-slate-800">Contributors</h2>
          </div>
          <button
            type="button"
            className="group flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 transition-all hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setOpenModal('contributors')}
            disabled={!hasLinkedRepository || normalized.contributorsPreview.length === 0}
          >
            View all
            <ChevronRight className="h-3 w-3 transition-transform group-last:translate-x-0.5" />
          </button>
        </div>
        {topContributors.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topContributors.map((contributor) => {
              const avatarUrl =
                getGitHubAvatarUrl({
                  name: contributor.name,
                  githubUsername: contributor.githubUsername,
                  avatarUrl: contributor.avatarUrl,
                }) ?? getGeneratedAvatarUrl(contributor.name);
              return (
                <article
                  key={contributor.name}
                  className="flex items-center gap-3 rounded-2xl border border-slate-50 bg-slate-50/50 p-3 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-white bg-white shadow-sm">
                    <img
                      src={avatarUrl}
                      alt={contributor.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getGeneratedAvatarUrl(
                          contributor.name,
                        );
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-700">{contributor.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {contributor.commitCount} commits
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            No contributor activity recorded for this repository.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-slate-800">Activity Feed</h2>
          </div>
          <button
            type="button"
            className="group flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 transition-all hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setOpenModal('activity')}
            disabled={!hasLinkedRepository || normalized.recentCommitsPreview.length === 0}
          >
            View full feed
            <ChevronRight className="h-3 w-3 transition-transform group-last:translate-x-0.5" />
          </button>
        </div>
        {recentCommits.length > 0 ? (
          <div className="mt-6 flex flex-col gap-4">{recentCommits.map(renderCommitCard)}</div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            No recent activity found.
          </div>
        )}
      </section>

      <GithubDetailsModal
        isOpen={openModal === 'contributors'}
        title="GitHub Contributors"
        onClose={() => setOpenModal(null)}
      >
        <GithubContributorsModalContent
          isOpen={openModal === 'contributors'}
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
          fetchPage={loadActivityPage}
        />
      </GithubDetailsModal>
    </div>
  );
}
