import { useCallback, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { isApiException } from '@/services/apiClient';
import type { ProjectGitHubContributor } from '../types';
import type { PaginatedListResult } from '../types';
import { getGeneratedAvatarUrl, getGitHubAvatarUrl } from '../utils/githubIdentity';

type GithubContributorsModalContentProps = {
  isOpen: boolean;
  fetchPage: (page: number) => Promise<PaginatedListResult<ProjectGitHubContributor>>;
};

function ContributorItemSkeleton() {
  return (
    <article className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="h-12 w-12 rounded-full bg-slate-100" />
      <div className="flex-1">
        <div className="h-4 w-1/3 rounded bg-slate-100" />
        <div className="mt-2 h-3 w-1/5 rounded bg-slate-100" />
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
        setItems((current: ProjectGitHubContributor[]) =>
          append ? [...current, ...result.items] : result.items,
        );
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
    <div className="flex flex-col gap-3">
      {items.map((contributor, index) => {
        const avatarUrl =
          getGitHubAvatarUrl({
            name: contributor.name,
            githubUsername: contributor.githubUsername,
            avatarUrl: contributor.avatarUrl,
          }) ?? getGeneratedAvatarUrl(contributor.name);

        return (
          <article
            key={`${contributor.name}-${index}`}
            className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-amber-200 hover:shadow-md"
          >
            <div className="relative shrink-0">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-100 bg-slate-50 transition-transform group-hover:scale-110">
                <img
                  src={avatarUrl}
                  alt={contributor.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getGeneratedAvatarUrl(contributor.name);
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white ring-2 ring-white">
                {index + 1}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                {contributor.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {contributor.commitCount} Total Commits
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-emerald-600">Active Contributor</span>
              </div>
            </div>
          </article>
        );
      })}

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
