type MeasureLongestLabelParams = {
  labels: string[];
  fontSourceEl: Element | null | undefined;
};

function isJsdomEnvironment() {
  if (typeof navigator === 'undefined') return false;
  return /jsdom/i.test(navigator.userAgent);
}

function getFontShorthand(element: Element | null | undefined): string {
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

export function measureLongestLabelPx({ labels, fontSourceEl }: MeasureLongestLabelParams): number {
  const fallbackEstimate = () => {
    const maxChars = labels.reduce((max, label) => Math.max(max, label.length), 0);
    return maxChars * 7;
  };

  if (labels.length === 0) return 0;
  if (isJsdomEnvironment()) return fallbackEstimate();

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return fallbackEstimate();
    context.font = getFontShorthand(fontSourceEl);
    return labels.reduce((max, label) => Math.max(max, context.measureText(label).width), 0);
  } catch {
    return fallbackEstimate();
  }
}
