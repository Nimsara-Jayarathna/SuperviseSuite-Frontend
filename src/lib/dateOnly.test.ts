import { describe, expect, it } from 'vitest';
import { parseLocalDateOnly } from './dateOnly';

describe('parseLocalDateOnly', () => {
  it('returns null for nullish and malformed values', () => {
    expect(parseLocalDateOnly(null)).toBeNull();
    expect(parseLocalDateOnly(undefined)).toBeNull();
    expect(parseLocalDateOnly('')).toBeNull();
    expect(parseLocalDateOnly('2026-3-08')).toBeNull();
    expect(parseLocalDateOnly(' 2026-03-08')).toBeNull();
    expect(parseLocalDateOnly('2026-03-08 ')).toBeNull();
    expect(parseLocalDateOnly('2026-03-08T00:00:00Z')).toBeNull();
  });

  it('parses valid YYYY-MM-DD into a local Date', () => {
    const parsed = parseLocalDateOnly('2026-03-08');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(2);
    expect(parsed?.getDate()).toBe(8);
  });

  it('rejects overflow and invalid calendar dates', () => {
    expect(parseLocalDateOnly('2026-13-01')).toBeNull();
    expect(parseLocalDateOnly('2026-00-10')).toBeNull();
    expect(parseLocalDateOnly('2026-02-30')).toBeNull();
    expect(parseLocalDateOnly('2026-04-31')).toBeNull();
  });
});

