import { useCallback, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { isApiException } from '@/services/apiClient';
import type { ProjectGitHubContributor } from '../types';
import type { PaginatedListResult } from '../types';

function initialsOf(name: string) {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  const first = parts[0][0] ?? '';
  const second = parts.length > 1 ? (parts[1][0] ?? '') : '';
  return `${first}${second}`.toUpperCase();
}

type GithubContributorsModalContentProps = {
  isOpen: boolean;
  fetchPage: (page: number) => Promise<PaginatedListResult<ProjectGitHubContributor>>;
};

function ContributorItemSkeleton() {
  return (
    <article className="flex animate-pulse items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="h-10 w-10 rounded-full bg-slate-200" />
      <div className="flex-1">
        <div className="h-4 w-2/5 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-1/4 rounded bg-slate-200" />
      </div>
    </article>
  );
}

export function GithubContributorsModalContent({
  isOpen,
  fetchPage,
}: GithubContributorsModalContentProps) {
  const [items, setItems] = useState<ProjectGitHubContributor[]>([]);
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
            : 'Unable to load GitHub contributors right now.',
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
        {Array.from({ length: 6 }).map((_, index) => (
          <ContributorItemSkeleton key={`contributor-skeleton-${index}`} />
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
    return <p className="text-sm text-muted-foreground">No contributors found.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((contributor, index) => (
        <article
          key={`${contributor.name}-${index}`}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {initialsOf(contributor.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              #{index + 1} {contributor.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {contributor.commitCount} commit{contributor.commitCount === 1 ? '' : 's'}
            </p>
          </div>
        </article>
      ))}

      {isLoadingMore ? (
        <div className="space-y-3 pt-1">
          {Array.from({ length: 2 }).map((_, index) => (
            <ContributorItemSkeleton key={`contributors-bottom-skeleton-${index}`} />
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
              View more contributors
              <ChevronDown className="h-4 w-4" />
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
