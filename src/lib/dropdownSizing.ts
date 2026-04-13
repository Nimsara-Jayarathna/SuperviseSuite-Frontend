const VIEWPORT_HORIZONTAL_PADDING = 8;
const MENU_HORIZONTAL_PADDING = 32; // px-4 on both sides
const CHECKMARK_SPACE = 24;
const SAFETY_BUFFER = 12;

function getContextFont(element: HTMLElement): string {
  const styles = window.getComputedStyle(element);
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
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  context.font = font;
  return labels.reduce((max, label) => Math.max(max, context.measureText(label).width), 0);
}

export function calculateDropdownLayout(params: {
  triggerRect: DOMRect;
  labels: string[];
  fontSourceEl: HTMLElement;
}) {
  const { triggerRect, labels, fontSourceEl } = params;
  const minWidth = triggerRect.width;
  const font = getContextFont(fontSourceEl);
  const contentWidth =
    measureLongestLabelWidth(labels, font) + MENU_HORIZONTAL_PADDING + CHECKMARK_SPACE + SAFETY_BUFFER;
  const maxWidth = Math.max(0, window.innerWidth - VIEWPORT_HORIZONTAL_PADDING * 2);
  const width = Math.min(Math.max(minWidth, contentWidth), maxWidth);

  const minLeft = window.scrollX + VIEWPORT_HORIZONTAL_PADDING;
  const maxLeft = window.scrollX + window.innerWidth - VIEWPORT_HORIZONTAL_PADDING - width;
  const left = Math.min(Math.max(triggerRect.left + window.scrollX, minLeft), maxLeft);
  const top = triggerRect.bottom + window.scrollY;

  return { top, left, width };
}
