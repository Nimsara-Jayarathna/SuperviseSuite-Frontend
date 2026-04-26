const VIEWPORT_HORIZONTAL_PADDING = 8;
const VIEWPORT_VERTICAL_PADDING = 8;
const MENU_HORIZONTAL_PADDING = 32; // px-4 on both sides
const CHECKMARK_SPACE = 24;
const SAFETY_BUFFER = 12;
const ESTIMATED_ITEM_HEIGHT = 40;
const ESTIMATED_MENU_PADDING = 8;

export type DropdownAlign = 'auto' | 'start' | 'end';

function isJsdomEnvironment() {
  if (typeof navigator === 'undefined') return false;
  return /jsdom/i.test(navigator.userAgent);
}

function getContextFont(element: Element | null | undefined): string {
  const fallback = document.body ?? document.documentElement;
  const resolvedEl = element instanceof Element ? element : fallback;
  if (!resolvedEl) {
    return 'normal normal 400 14px/20px system-ui, sans-serif';
  }

  const styles = window.getComputedStyle(resolvedEl);
  return [
    styles.fontStyle,
    styles.fontVariant,
    styles.fontWeight,
    styles.fontSize,
    styles.lineHeight,
    styles.fontFamily,
  ].join(' ');
}

function measureLongestLabelWidth(labels: string[], font: string): number {
  const fallbackEstimate = () => {
    const maxChars = labels.reduce((max, label) => Math.max(max, label.length), 0);
    return maxChars * 7;
  };

  if (labels.length === 0) return 0;

  // JSDOM's canvas implementation is missing and logs noisy warnings in tests.
  if (isJsdomEnvironment()) return fallbackEstimate();

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return fallbackEstimate();
    context.font = font;
    return labels.reduce((max, label) => Math.max(max, context.measureText(label).width), 0);
  } catch {
    return fallbackEstimate();
  }
}

export function calculateDropdownLayout(params: {
  triggerRect: DOMRect;
  labels: string[];
  fontSourceEl: Element | null | undefined;
  align?: DropdownAlign;
  offset?: number;
  matchTriggerWidth?: boolean;
  menuHeight?: number;
}) {
  const {
    triggerRect,
    labels,
    fontSourceEl,
    align = 'auto',
    offset = 6,
    matchTriggerWidth = true,
    menuHeight,
  } = params;

  const minWidth = matchTriggerWidth ? triggerRect.width : 0;
  const font = getContextFont(fontSourceEl);
  const contentWidth =
    measureLongestLabelWidth(labels, font) +
    MENU_HORIZONTAL_PADDING +
    CHECKMARK_SPACE +
    SAFETY_BUFFER;
  const viewportLeft = window.scrollX + VIEWPORT_HORIZONTAL_PADDING;
  const viewportRight = window.scrollX + window.innerWidth - VIEWPORT_HORIZONTAL_PADDING;
  const viewportWidth = Math.max(0, viewportRight - viewportLeft);

  const desiredWidth = Math.min(Math.max(minWidth, contentWidth), viewportWidth);
  const triggerLeft = triggerRect.left + window.scrollX;
  const triggerRight = triggerRect.right + window.scrollX;

  const leftStart = triggerLeft;
  const availStart = Math.max(0, viewportRight - leftStart);
  const fitsStart = desiredWidth <= availStart;

  const availEnd = Math.max(0, triggerRight - viewportLeft);
  const fitsEnd = desiredWidth <= availEnd;

  const chosenAlign: Exclude<DropdownAlign, 'auto'> = (() => {
    if (align === 'start') return 'start';
    if (align === 'end') return 'end';
    if (fitsStart) return 'start';
    if (fitsEnd) return 'end';
    return availEnd >= availStart ? 'end' : 'start';
  })();

  const availChosen = chosenAlign === 'end' ? availEnd : availStart;
  const width = Math.max(0, Math.min(desiredWidth, availChosen));
  const unclampedLeft = chosenAlign === 'end' ? triggerRight - width : triggerLeft;

  const minLeft = viewportLeft;
  const maxLeft = viewportRight - width;
  const left = Math.min(Math.max(unclampedLeft, minLeft), maxLeft);

  const estimatedMenuHeight =
    labels.length * ESTIMATED_ITEM_HEIGHT + ESTIMATED_MENU_PADDING * 2 + SAFETY_BUFFER;
  const requiredMenuHeight = menuHeight ?? estimatedMenuHeight;
  const maxHeightBelow = Math.max(
    0,
    window.innerHeight - triggerRect.bottom - VIEWPORT_VERTICAL_PADDING - offset,
  );
  const maxHeightAbove = Math.max(0, triggerRect.top - VIEWPORT_VERTICAL_PADDING - offset);

  const fitsBelow = requiredMenuHeight <= maxHeightBelow;
  const fitsAbove = requiredMenuHeight <= maxHeightAbove;

  const placement: 'up' | 'down' = (() => {
    // Prefer opening downward whenever it fully fits.
    if (fitsBelow) return 'down';
    // Otherwise, open upward if it fully fits above.
    if (fitsAbove) return 'up';
    // If neither side fully fits, pick the side with more space (down on ties).
    return maxHeightAbove > maxHeightBelow ? 'up' : 'down';
  })();

  const maxHeight = placement === 'up' ? maxHeightAbove : maxHeightBelow;
  const renderedHeight = Math.min(requiredMenuHeight, maxHeight);

  const top =
    placement === 'up'
      ? triggerRect.top + window.scrollY - renderedHeight - offset
      : triggerRect.bottom + window.scrollY + offset;

  return { top, left, width, maxHeight, placement };
}
