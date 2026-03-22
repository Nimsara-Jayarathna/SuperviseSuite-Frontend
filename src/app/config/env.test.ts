import { describe, expect, it } from 'vitest';
import { normalizeApiBaseUrl, sanitizeViteEnvValue } from './env';

describe('env config sanitization', () => {
  it('keeps valid values unchanged except trimming', () => {
    expect(sanitizeViteEnvValue('  https://stg.supervisesuite.blipzo.xyz  ')).toBe(
      'https://stg.supervisesuite.blipzo.xyz',
    );
  });

  it('removes concatenated VITE assignment suffix from malformed values', () => {
    const malformed =
      'https://stg.supervisesuite.blipzo.xyzVITE_GITHUB_APP_INSTALL_URL=https://github.com/apps/supervisesuite-github-integration/installations/new';
    expect(sanitizeViteEnvValue(malformed)).toBe('https://stg.supervisesuite.blipzo.xyz');
  });

  it('removes trailing slash from API base url', () => {
    expect(normalizeApiBaseUrl('https://stg.supervisesuite.blipzo.xyz/')).toBe(
      'https://stg.supervisesuite.blipzo.xyz',
    );
  });
});
