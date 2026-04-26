import { describe, expect, it } from 'vitest';
import { computePillDropdownWidthPx } from './pillDropdownSizing';

describe('computePillDropdownWidthPx', () => {
  it('clamps to the minimum width', () => {
    expect(computePillDropdownWidthPx({ labelPx: 10, minWidthPx: 160, maxWidthPx: 240 })).toBe(160);
  });

  it('clamps to the maximum width', () => {
    expect(computePillDropdownWidthPx({ labelPx: 1000, minWidthPx: 160, maxWidthPx: 240 })).toBe(
      240,
    );
  });

  it('returns a width >= label width + chrome', () => {
    const width = computePillDropdownWidthPx({ labelPx: 120, minWidthPx: 160, maxWidthPx: 240 });
    expect(width).toBeGreaterThanOrEqual(160);
    expect(width).toBeLessThanOrEqual(240);
  });
});
