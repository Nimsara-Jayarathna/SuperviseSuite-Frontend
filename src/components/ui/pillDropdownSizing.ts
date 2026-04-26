const PILL_ICON_PX = 16;
const PILL_CARET_PX = 16;
const PILL_GAP_PX = 8 * 2; // gap-2 between 3 columns
const PILL_PADDING_X_PX = 12 * 2; // px-3

export function computePillDropdownWidthPx(params: {
  labelPx: number;
  minWidthPx?: number;
  maxWidthPx?: number;
}) {
  const { labelPx, minWidthPx = 160, maxWidthPx = 240 } = params;
  const baseWidth = Math.ceil(
    labelPx + PILL_ICON_PX + PILL_CARET_PX + PILL_GAP_PX + PILL_PADDING_X_PX,
  );
  return Math.max(minWidthPx, Math.min(baseWidth, maxWidthPx));
}
