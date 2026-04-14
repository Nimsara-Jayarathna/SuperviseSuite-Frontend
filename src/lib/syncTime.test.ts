import { describe, expect, it } from 'vitest';
import { formatLastSynced } from './syncTime';

describe('formatLastSynced', () => {
  const now = new Date('2026-04-14T12:00:00Z');

  it('returns unsynced for null and invalid values', () => {
    expect(formatLastSynced(null, now)).toEqual({
      isSynced: false,
      displayText: '',
      tooltipText: null,
    });

    expect(formatLastSynced('not-a-date', now)).toEqual({
      isSynced: false,
      displayText: '',
      tooltipText: null,
    });
  });

  it('formats less than 60 seconds as just now', () => {
    const result = formatLastSynced('2026-04-14T11:59:30Z', now);
    expect(result.isSynced).toBe(true);
    expect(result.displayText).toBe('just now');
    expect(result.tooltipText).toContain('2026');
  });

  it('formats minutes, hours, and days relatively', () => {
    expect(formatLastSynced('2026-04-14T11:35:00Z', now).displayText).toBe('25m ago');
    expect(formatLastSynced('2026-04-14T09:00:00Z', now).displayText).toBe('3h ago');
    expect(formatLastSynced('2026-04-12T12:00:00Z', now).displayText).toBe('2d ago');
  });

  it('switches to absolute format at 7 days or older', () => {
    const result = formatLastSynced('2026-04-07T12:00:00Z', now);
    expect(result.isSynced).toBe(true);
    expect(result.displayText).toMatch(/^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{1,2}:\d{2}\s+[AP]M$/);
    expect(result.tooltipText).toContain('2026');
  });
});
