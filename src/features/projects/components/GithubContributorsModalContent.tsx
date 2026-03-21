import type { ProjectGitHubContributor } from '../types';

function initialsOf(name: string) {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  const first = parts[0][0] ?? '';
  const second = parts.length > 1 ? parts[1][0] ?? '' : '';
  return `${first}${second}`.toUpperCase();
}

type GithubContributorsModalContentProps = {
  contributors: ProjectGitHubContributor[];
};

export function GithubContributorsModalContent({ contributors }: GithubContributorsModalContentProps) {
  if (contributors.length === 0) {
    return <p className="text-sm text-muted-foreground">No contributors found.</p>;
  }

  return (
    <div className="space-y-3">
      {contributors.map((contributor, index) => (
        <article
          key={`${contributor.name}-${index}`}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {initialsOf(contributor.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">#{index + 1} {contributor.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {contributor.commitCount} commit{contributor.commitCount === 1 ? '' : 's'}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
