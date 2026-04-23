type DateOnlyParts = { year: number; monthIndex: number; day: number };

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateOnlyParts(value: string): DateOnlyParts | null {
  if (!DATE_ONLY_RE.test(value)) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const monthIndex = month - 1;
  const parsed = new Date(year, monthIndex, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== monthIndex ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return { year, monthIndex, day };
}

export function parseLocalDateOnly(value: string | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parts = parseDateOnlyParts(value);
  if (!parts) {
    return null;
  }

  return new Date(parts.year, parts.monthIndex, parts.day);
}

/**
 * Returns the calendar day difference (date-only) between a YYYY-MM-DD value and a reference date.
 * Uses UTC midnights to avoid DST 23/25-hour day drift.
 */
export function diffDaysDateOnly(value: string | null | undefined, reference: Date): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parts = parseDateOnlyParts(value);
  if (!parts) {
    return null;
  }

  const targetUtc = Date.UTC(parts.year, parts.monthIndex, parts.day);
  const referenceUtc = Date.UTC(reference.getFullYear(), reference.getMonth(), reference.getDate());
  return (targetUtc - referenceUtc) / DAY_IN_MS;
}
