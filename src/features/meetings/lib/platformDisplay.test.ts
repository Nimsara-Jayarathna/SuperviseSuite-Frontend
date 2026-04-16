import { describe, expect, it } from 'vitest';
import { getMeetingPlatformDisplay } from './platformDisplay';

describe('getMeetingPlatformDisplay', () => {
  it('returns brand icon metadata for Google Meet', () => {
    const display = getMeetingPlatformDisplay('GOOGLE_MEET');

    expect(display.label).toBe('Google Meet');
    expect(display.kind).toBe('simple-icon');
    if (display.kind !== 'simple-icon') {
      throw new Error('Expected simple-icon display');
    }

    expect(display.hex).toMatch(/^[0-9A-Fa-f]{6}$/);
    expect(display.path.length).toBeGreaterThan(10);
  });

  it('returns a Teams fallback icon display', () => {
    const display = getMeetingPlatformDisplay('TEAMS');

    expect(display.label).toBe('Microsoft Teams');
    expect(display.kind).toBe('lucide');
    if (display.kind !== 'lucide') {
      throw new Error('Expected lucide display');
    }

    expect(display.hex).toBe('6264A7');
    expect(display.Icon).toBeDefined();
  });

  it('returns an Other fallback icon display', () => {
    const display = getMeetingPlatformDisplay('OTHER');

    expect(display.label).toBe('Other');
    expect(display.kind).toBe('lucide');
  });
});
