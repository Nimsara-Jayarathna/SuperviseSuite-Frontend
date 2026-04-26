import { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  GitCommit,
  GitMerge,
  Terminal,
  FileText,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { isApiException } from '@/services/apiClient';
import type { ProjectGitHubRecentCommit } from '../types';
import type { PaginatedListResult } from '../types';
import { getGeneratedAvatarUrl, getGitHubAvatarUrl } from '../utils/githubIdentity';

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
  if (type === 'merge') return 'bg-slate-50 text-slate-600 border-slate-100';
  if (type === 'feat') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (type === 'fix') return 'bg-rose-50 text-rose-700 border-rose-100';
  if (type === 'refactor') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  if (type === 'ci' || type === 'build') return 'bg-cyan-50 text-cyan-700 border-cyan-100';
  if (type === 'docs') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (type === 'test') return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100';
  if (type === 'perf') return 'bg-teal-50 text-teal-700 border-teal-100';
  if (type === 'revert') return 'bg-rose-50 text-rose-700 border-rose-100';
  if (type === 'style') return 'bg-lime-50 text-lime-700 border-lime-100';
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
        setItems((current: ProjectGitHubRecentCommit[]) =>
          append ? [...current, ...result.items] : result.items,
        );
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
                    <TimeAgo
                      date={commit.committedAt}
                      className="text-xs font-medium text-slate-400"
                    />
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
