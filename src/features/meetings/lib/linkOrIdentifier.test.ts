import { describe, expect, it } from 'vitest';
import { isProbablyUrl } from './linkOrIdentifier';

describe('isProbablyUrl', () => {
  it('returns true for http and https urls', () => {
    expect(isProbablyUrl('https://example.com')).toBe(true);
    expect(isProbablyUrl('http://example.com')).toBe(true);
  });

  it('returns false for non-urls', () => {
    expect(isProbablyUrl('ABC123')).toBe(false);
    expect(isProbablyUrl('')).toBe(false);
    expect(isProbablyUrl('meet.google.com/abc')).toBe(false);
  });
});
