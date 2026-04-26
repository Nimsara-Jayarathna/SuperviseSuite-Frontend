import { describe, expect, it } from 'vitest';
import { calculateDropdownLayout } from './dropdownSizing';

function setViewport(params: {
  width: number;
  height: number;
  scrollX?: number;
  scrollY?: number;
}) {
  const { width, height, scrollX = 0, scrollY = 0 } = params;
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
  Object.defineProperty(window, 'scrollX', { value: scrollX, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true });
}

describe('calculateDropdownLayout', () => {
  it('end-aligns near the right edge to stay attached', () => {
    setViewport({ width: 300, height: 200 });
    const triggerRect = new DOMRect(240, 10, 50, 32); // right = 290
    const labels = ['A VERY LONG OPTION LABEL'];
    const { left, width } = calculateDropdownLayout({
      triggerRect,
      labels,
      fontSourceEl: document.body,
      align: 'auto',
      offset: 6,
      matchTriggerWidth: true,
    });

    expect(left + width).toBe(290);
  });

  it('shrinks to fit when neither start nor end fits', () => {
    setViewport({ width: 300, height: 200 });
    const triggerRect = new DOMRect(20, 10, 50, 32);
    const labels = ['X'.repeat(200)];
    const { left, width } = calculateDropdownLayout({
      triggerRect,
      labels,
      fontSourceEl: document.body,
      align: 'auto',
      offset: 6,
      matchTriggerWidth: true,
    });

    // With 8px viewport padding, viewportRight = 292
    expect(left).toBe(20);
    expect(left + width).toBe(292);
  });

  it('shrinks and end-aligns when the right side has more available space', () => {
    setViewport({ width: 300, height: 200 });
    const triggerRect = new DOMRect(250, 10, 40, 32); // right = 290
    const labels = ['X'.repeat(200)];
    const { left } = calculateDropdownLayout({
      triggerRect,
      labels,
      fontSourceEl: document.body,
      align: 'auto',
      offset: 6,
      matchTriggerWidth: true,
    });

    // Menu should attach to trigger right edge and extend left to viewportLeft (8px)
    expect(left).toBe(8);
  });

  it('applies offset and flips upward when there is insufficient space below', () => {
    setViewport({ width: 300, height: 200 });
    const triggerRect = new DOMRect(20, 170, 80, 20); // bottom = 190
    const labels = ['ONE', 'TWO', 'THREE'];
    const { top } = calculateDropdownLayout({
      triggerRect,
      labels,
      fontSourceEl: document.body,
      align: 'start',
      offset: 6,
      matchTriggerWidth: true,
    });

    expect(top).toBe(16);
  });

  it('uses the real menu height when provided to avoid blank gaps', () => {
    setViewport({ width: 300, height: 200 });
    const triggerRect = new DOMRect(20, 170, 80, 20); // top = 170
    const labels = ['ONE', 'TWO', 'THREE'];
    const { top, placement } = calculateDropdownLayout({
      triggerRect,
      labels,
      fontSourceEl: document.body,
      align: 'start',
      offset: 6,
      matchTriggerWidth: true,
      menuHeight: 80,
    });

    expect(placement).toBe('up');
    expect(top).toBe(84);
  });

  it('opens downward when the menu fully fits below', () => {
    setViewport({ width: 300, height: 200 });
    const triggerRect = new DOMRect(20, 50, 80, 32); // bottom = 82
    const labels = ['ONE', 'TWO', 'THREE'];
    const { placement, top } = calculateDropdownLayout({
      triggerRect,
      labels,
      fontSourceEl: document.body,
      align: 'start',
      offset: 6,
      matchTriggerWidth: true,
      menuHeight: 80,
    });

    expect(placement).toBe('down');
    expect(top).toBe(88);
  });
});
