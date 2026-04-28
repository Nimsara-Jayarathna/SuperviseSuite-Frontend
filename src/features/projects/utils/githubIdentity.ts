type GitHubIdentity = {
  name?: string | null;
  githubUsername?: string | null;
  avatarUrl?: string | null;
};

function trimToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getGeneratedAvatarUrl(name: string | null | undefined) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(trimToNull(name) ?? 'Unknown')}&background=f1f5f9&color=94a3b8`;
}

export function getGitHubAvatarUrl(identity: GitHubIdentity) {
  const avatarUrl = trimToNull(identity.avatarUrl);
  if (avatarUrl) {
    return avatarUrl;
  }

  const githubUsername = trimToNull(identity.githubUsername);
  if (githubUsername) {
    return `https://github.com/${encodeURIComponent(githubUsername)}.png`;
  }

  return null;
}

export function getGitHubProfileUrl(githubUsername: string | null | undefined) {
  const trimmed = trimToNull(githubUsername);
  return trimmed ? `https://github.com/${encodeURIComponent(trimmed)}` : null;
}
