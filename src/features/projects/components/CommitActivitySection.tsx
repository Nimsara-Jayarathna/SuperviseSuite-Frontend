import type { ApiError } from '@/types';
import { buttonStyles } from '@/components/ui/Button';

type CommitItem = {
  sha: string | null;
  message: string;
  author: string;
  committedAt: string | null;
};

type ProjectCommitActivity = {
  repositoryLinked: boolean;
  commits: CommitItem[];
};

type CommitActivitySectionProps = {
  isLoading: boolean;
  error: ApiError | null;
  data: ProjectCommitActivity | null;
  onRetry: () => void;
};

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function CommitActivitySection({
  isLoading,
  error,
  data,
  onRetry,
}: CommitActivitySectionProps) {
  if (isLoading) {
    return (
      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Commit activity</h2>
        <div className="mt-4 space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`commit-loading-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-1/4 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-700">Commit activity unavailable</h2>
        <p className="mt-2 text-sm text-rose-700">
          {error.message || 'Unable to load commit activity right now.'}
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

  if (!data || data.repositoryLinked === false) {
    return (
      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Commit activity</h2>
        <p className="mt-3 text-sm text-muted-foreground">No repository connected.</p>
      </section>
    );
  }

  if (data.commits.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Commit activity</h2>
        <p className="mt-3 text-sm text-muted-foreground">No recent commits found.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Commit activity</h2>
      <div className="mt-4 space-y-3">
        {data.commits.map((commit, index) => (
          <article
            key={`${commit.sha ?? 'commit'}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-sm font-medium text-foreground">{commit.message || 'No message'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>Author: {commit.author || 'Unknown'}</span>
              <span>
                Date:{' '}
                {commit.committedAt
                  ? dateTimeFormatter.format(new Date(commit.committedAt))
                  : 'Unknown'}
              </span>
              {commit.sha ? <span>SHA: {commit.sha.slice(0, 7)}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}