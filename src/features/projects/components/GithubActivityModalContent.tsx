import type { ProjectGitHubRecentCommit } from '../types';

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
  commits: ProjectGitHubRecentCommit[];
};

export function GithubActivityModalContent({ commits }: GithubActivityModalContentProps) {
  if (commits.length === 0) {
    return <p className="text-sm text-muted-foreground">No GitHub activity found.</p>;
  }

  return (
    <div className="space-y-3">
      {commits.map((commit, index) => {
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
    </div>
  );
}
