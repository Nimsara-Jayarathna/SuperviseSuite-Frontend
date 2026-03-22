import { useCallback, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { isApiException } from '@/services/apiClient';
import type { ProjectGitHubRecentCommit } from '../types';
import type { PaginatedListResult } from '../types';

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
  if (type === 'merge') return 'bg-slate-200 text-slate-700';
  if (type === 'feat') return 'bg-emerald-100 text-emerald-700';
  if (type === 'fix') return 'bg-sky-100 text-sky-700';
  if (type === 'refactor') return 'bg-violet-100 text-violet-700';
  if (type === 'ci' || type === 'build') return 'bg-cyan-100 text-cyan-700';
  if (type === 'docs') return 'bg-amber-100 text-amber-700';
  if (type === 'test') return 'bg-fuchsia-100 text-fuchsia-700';
  if (type === 'perf') return 'bg-teal-100 text-teal-700';
  if (type === 'revert') return 'bg-rose-100 text-rose-700';
  if (type === 'style') return 'bg-lime-100 text-lime-700';
  return 'bg-zinc-100 text-zinc-700';
}

type GithubActivityModalContentProps = {
  isOpen: boolean;
  fetchPage: (page: number) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;
};

function ActivityItemSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/4 rounded bg-slate-200" />
    </article>
  );
}

export function GithubActivityModalContent({ isOpen, fetchPage }: GithubActivityModalContentProps) {
  const [items, setItems] = useState<ProjectGitHubRecentCommit[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPage = useCallback(
    async (targetPage: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoading(true);
      }
      setErrorMessage(null);

      try {
        const result = await fetchPage(targetPage);
        setItems((current) => (append ? [...current, ...result.items] : result.items));
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        setErrorMessage(
          isApiException(error)
            ? error.apiError.message
            : 'Unable to load GitHub activity right now.',
        );
      } finally {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsInitialLoading(false);
        }
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setItems([]);
    setPage(1);
    setHasMore(false);
    void loadPage(1, false);
  }, [isOpen, loadPage]);

  async function handleLoadMore() {
    if (!hasMore || isLoadingMore || isInitialLoading) {
      return;
    }
    await loadPage(page + 1, true);
  }

  if (isInitialLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <ActivityItemSkeleton key={`activity-skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-rose-700">{errorMessage}</p>
        <button
          type="button"
          onClick={() => void loadPage(1, false)}
          className={buttonStyles({ variant: 'secondary', size: 'sm' })}
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No GitHub activity found.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((commit, index) => {
        const type = getCommitType(commit.message);
        const shortSha = commit.sha ? commit.sha.slice(0, 7) : null;

        return (
          <article
            key={`${commit.sha ?? 'commit'}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <p
                className="text-sm font-medium text-foreground break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden"
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
      })}

      {isLoadingMore ? (
        <div className="space-y-3 pt-1">
          {Array.from({ length: 2 }).map((_, index) => (
            <ActivityItemSkeleton key={`activity-bottom-skeleton-${index}`} />
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center pt-3">
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            className={buttonStyles({
              variant: 'secondary',
              size: 'sm',
              className: 'rounded-full px-4 font-medium',
            })}
            disabled={isInitialLoading || isLoadingMore}
          >
            <span className="inline-flex items-center gap-1.5">
              View more activity
              <ChevronDown className="h-4 w-4" />
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
