import { useCallback, useEffect, useState } from 'react';
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

function getCommitType(message: string): 'merge' | 'feat' | 'fix' | null {
  const normalized = message.trim().toLowerCase();
  if (normalized.startsWith('merge')) return 'merge';
  if (normalized.startsWith('feat') || normalized.startsWith('feature')) return 'feat';
  if (normalized.startsWith('fix')) return 'fix';
  return null;
}

function commitTypeBadgeClass(type: 'merge' | 'feat' | 'fix') {
  if (type === 'merge') return 'bg-slate-200 text-slate-700';
  if (type === 'feat') return 'bg-emerald-100 text-emerald-700';
  return 'bg-sky-100 text-sky-700';
}

type GithubActivityModalContentProps = {
  isOpen: boolean;
  pageSize: number;
  fetchPage: (page: number, size: number) => Promise<PaginatedListResult<ProjectGitHubRecentCommit>>;
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

export function GithubActivityModalContent({
  isOpen,
  pageSize,
  fetchPage,
}: GithubActivityModalContentProps) {
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
        const result = await fetchPage(targetPage, pageSize);
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
    [fetchPage, pageSize],
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

        return (
          <article
            key={`${commit.sha ?? 'commit'}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{commit.message || 'No message'}</p>
              {type ? (
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${commitTypeBadgeClass(type)}`}
                >
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
      })}

      {isLoadingMore ? (
        <div className="space-y-3 pt-1">
          {Array.from({ length: 2 }).map((_, index) => (
            <ActivityItemSkeleton key={`activity-bottom-skeleton-${index}`} />
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            disabled={isInitialLoading || isLoadingMore}
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}
