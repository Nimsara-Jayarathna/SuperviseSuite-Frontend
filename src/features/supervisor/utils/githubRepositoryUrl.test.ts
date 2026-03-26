import { describe, expect, it } from 'vitest';
import { normalizeGitHubRepositoryUrl } from './githubRepositoryUrl';

describe('normalizeGitHubRepositoryUrl', () => {
  it('normalizes canonical URL', () => {
    expect(
      normalizeGitHubRepositoryUrl(
        'https://github.com/Nimsara-Jayarathna/SuperviseSuite-Frontend',
      ),
    ).toBe('https://github.com/Nimsara-Jayarathna/SuperviseSuite-Frontend');
  });

  it('normalizes trailing slash and .git variants', () => {
    expect(
      normalizeGitHubRepositoryUrl(
        'https://github.com/Nimsara-Jayarathna/SuperviseSuite-Frontend/',
      ),
    ).toBe('https://github.com/Nimsara-Jayarathna/SuperviseSuite-Frontend');

    expect(
      normalizeGitHubRepositoryUrl(
        'https://github.com/Nimsara-Jayarathna/SuperviseSuite-Frontend.git',
      ),
    ).toBe('https://github.com/Nimsara-Jayarathna/SuperviseSuite-Frontend');
  });

  it('accepts host without scheme', () => {
    expect(
      normalizeGitHubRepositoryUrl('github.com/Nimsara-Jayarathna/SuperviseSuite-Frontend'),
    ).toBe('https://github.com/Nimsara-Jayarathna/SuperviseSuite-Frontend');
  });

  it('rejects invalid formats', () => {
    expect(normalizeGitHubRepositoryUrl('https://github.com/Nimsara-Jayarathna')).toBeNull();
    expect(
      normalizeGitHubRepositoryUrl(
        'https://gitlab.com/Nimsara-Jayarathna/SuperviseSuite-Frontend',
      ),
    ).toBeNull();
    expect(normalizeGitHubRepositoryUrl('not-a-url')).toBeNull();
  });
});

