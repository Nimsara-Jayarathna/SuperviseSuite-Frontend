const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RELATIVE_THRESHOLD_DAYS = 7;

const absoluteDisplayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const tooltipFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export type LastSyncedDisplay = {
  isSynced: boolean;
  displayText: string;
  tooltipText: string | null;
};

export function formatLastSynced(
  lastSyncedAt: string | null | undefined,
  now = new Date(),
): LastSyncedDisplay {
  if (!lastSyncedAt) {
    return {
      isSynced: false,
      displayText: '',
      tooltipText: null,
    };
  }

  const parsed = new Date(lastSyncedAt);
  if (Number.isNaN(parsed.getTime())) {
    return {
      isSynced: false,
      displayText: '',
      tooltipText: null,
    };
  }

  const rawDiffMs = now.getTime() - parsed.getTime();
  const diffMs = Math.max(0, rawDiffMs);

  if (diffMs < MINUTE_MS) {
    return {
      isSynced: true,
      displayText: 'just now',
      tooltipText: tooltipFormatter.format(parsed),
    };
  }

  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS);
    return {
      isSynced: true,
      displayText: `${minutes}m ago`,
      tooltipText: tooltipFormatter.format(parsed),
    };
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return {
      isSynced: true,
      displayText: `${hours}h ago`,
      tooltipText: tooltipFormatter.format(parsed),
    };
  }

  if (diffMs < RELATIVE_THRESHOLD_DAYS * DAY_MS) {
    const days = Math.floor(diffMs / DAY_MS);
    return {
      isSynced: true,
      displayText: `${days}d ago`,
      tooltipText: tooltipFormatter.format(parsed),
    };
  }

  return {
    isSynced: true,
    displayText: absoluteDisplayFormatter.format(parsed),
    tooltipText: tooltipFormatter.format(parsed),
  };
}
