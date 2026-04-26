import { describe, expect, it } from 'vitest';
import { getGeneratedAvatarUrl, getGitHubAvatarUrl, getGitHubProfileUrl } from './githubIdentity';

describe('githubIdentity', () => {
  it('uses explicit avatarUrl first', () => {
    expect(
      getGitHubAvatarUrl({
        name: 'Alice Doe',
        githubUsername: 'alice-dev',
        avatarUrl: 'https://avatars.githubusercontent.com/u/42?v=4',
      }),
    ).toBe('https://avatars.githubusercontent.com/u/42?v=4');
  });

  it('falls back to githubUsername avatar url', () => {
    expect(getGitHubAvatarUrl({ name: 'Alice Doe', githubUsername: 'alice-dev' })).toBe(
      'https://github.com/alice-dev.png',
    );
  });

  it('returns null when GitHub identity is missing', () => {
    expect(getGitHubAvatarUrl({ name: 'Alice Doe' })).toBeNull();
  });

  it('creates generated fallback avatars from display names', () => {
    expect(getGeneratedAvatarUrl('Alice Doe')).toBe(
      'https://ui-avatars.com/api/?name=Alice%20Doe&background=f1f5f9&color=94a3b8',
    );
  });

  it('only creates GitHub profile links for real GitHub usernames', () => {
    expect(getGitHubProfileUrl('alice-dev')).toBe('https://github.com/alice-dev');
    expect(getGitHubProfileUrl('   ')).toBeNull();
  });
});
