import { useState } from 'react';
import type { ApiError } from '@/types';
import { buttonStyles } from '@/components/ui/Button';
import type { ProjectGitHubDashboard, ProjectGitHubRecentCommit } from '../types';
import { GithubDetailsModal } from './GithubDetailsModal';
import { GithubActivityModalContent } from './GithubActivityModalContent';
import { GithubContributorsModalContent } from './GithubContributorsModalContent';

type CommitActivitySectionProps = {
  isLoading: boolean;
  error: ApiError | null;
  data: ProjectGitHubDashboard | null;
  onRetry: () => void;
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

function getCommitType(message: string): 'merge' | 'feat' | 'fix' | null {
  const normalized = message.trim().toLowerCase();
  if (normalized.startsWith('merge')) {
    return 'merge';
  }
  if (normalized.startsWith('feat') || normalized.startsWith('feature')) {
    return 'feat';
  }
  if (normalized.startsWith('fix')) {
    return 'fix';
  }
  return null;
}

function commitTypeBadgeClass(type: 'merge' | 'feat' | 'fix') {
  if (type === 'merge') {
    return 'bg-slate-200 text-slate-700';
  }
  if (type === 'feat') {
    return 'bg-emerald-100 text-emerald-700';
  }
  return 'bg-sky-100 text-sky-700';
}

function renderCommitCard(commit: ProjectGitHubRecentCommit, index: number) {
  const type = getCommitType(commit.message);

  return (
    <article
      key={`${commit.sha ?? 'commit'}-${index}`}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{commit.message || 'No message'}</p>
        {type ? (
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${commitTypeBadgeClass(type)}`}>
            {type}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Author: {commit.author || 'Unknown'}</span>
        <span>Time: {formatDateTime(commit.committedAt)}</span>
        {commit.sha ? <span>SHA: {commit.sha.slice(0, 7)}</span> : null}
      </div>
    </article>
  );
}

type LegacyCommitPayload = {
  repositoryLinked?: boolean;
  commits?: Array<{
    sha?: string | null;
    message?: string;
    author?: string;
    committedAt?: string | null;
  }>;
};

function normalizeDashboardPayload(raw: ProjectGitHubDashboard | LegacyCommitPayload): ProjectGitHubDashboard {
  const maybeDashboard = raw as ProjectGitHubDashboard;
  if (
    maybeDashboard &&
    typeof maybeDashboard === 'object' &&
    'activitySummary' in maybeDashboard &&
    'contributors' in maybeDashboard &&
    'recentCommits' in maybeDashboard
  ) {
    return {
      repositoryLinked: Boolean(maybeDashboard.repositoryLinked),
      repository: maybeDashboard.repository ?? null,
      activitySummary: {
        totalCommits: Number(maybeDashboard.activitySummary?.totalCommits ?? 0),
        lastActivityAt: maybeDashboard.activitySummary?.lastActivityAt ?? null,
        status: maybeDashboard.activitySummary?.status === 'active' ? 'active' : 'idle',
      },
      contributors: Array.isArray(maybeDashboard.contributors) ? maybeDashboard.contributors : [],
      recentCommits: Array.isArray(maybeDashboard.recentCommits) ? maybeDashboard.recentCommits : [],
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
    repository: null,
    activitySummary: {
      totalCommits: normalizedCommits.length,
      lastActivityAt: normalizedCommits[0]?.committedAt ?? null,
      status: normalizedCommits.length > 0 ? 'active' : 'idle',
    },
    contributors: [],
    recentCommits: normalizedCommits,
  };
}

export function CommitActivitySection({
  isLoading,
  error,
  data,
  onRetry,
}: CommitActivitySectionProps) {
  const [openModal, setOpenModal] = useState<'activity' | 'contributors' | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Repository Overview</h2>
          <div className="mt-4 animate-pulse space-y-3">
            <div
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
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
  const repositoryItems = normalized.repositoryLinked && normalized.repository ? [normalized.repository] : [];
  const topContributors = normalized.contributors.slice(0, 5);
  const recentCommits = normalized.recentCommits.slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Repository Overview</h2>
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
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No repository connected.</p>
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
          <div className="mt-4 space-y-3">
            {recentCommits.map(renderCommitCard)}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No recent activity found.</p>
        )}
      </section>

      <GithubDetailsModal
        isOpen={openModal === 'contributors'}
        title="GitHub Contributors"
        onClose={() => setOpenModal(null)}
      >
        <GithubContributorsModalContent contributors={normalized.contributors} />
      </GithubDetailsModal>

      <GithubDetailsModal
        isOpen={openModal === 'activity'}
        title="GitHub Activity"
        onClose={() => setOpenModal(null)}
      >
        <GithubActivityModalContent commits={normalized.recentCommits} />
      </GithubDetailsModal>
    </div>
  );
}
