export type CanonicalSyncStatus =
  | 'IN_PROGRESS'
  | 'SUCCESS'
  | 'PENDING'
  | 'FAILED'
  | 'DISABLED'
  | 'UNKNOWN';

export function normalizeSyncStatus(raw: string | null | undefined): CanonicalSyncStatus {
  if (!raw) {
    return 'UNKNOWN';
  }
  const value = raw.trim().toUpperCase();
  if (value === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (value === 'SUCCESS') return 'SUCCESS';
  if (value === 'PENDING') return 'PENDING';
  if (value === 'FAILED') return 'FAILED';
  if (value === 'DISABLED') return 'DISABLED';
  return 'UNKNOWN';
}

export function toSyncLabel(status: CanonicalSyncStatus): string {
  if (status === 'IN_PROGRESS') return 'Syncing';
  if (status === 'SUCCESS') return 'Synced';
  if (status === 'PENDING') return 'Pending';
  if (status === 'FAILED') return 'Sync failed';
  if (status === 'DISABLED') return 'Disabled';
  return 'Status unavailable';
}

export function toSyncHealthLabel(status: CanonicalSyncStatus): string {
  if (status === 'SUCCESS') return 'Healthy';
  if (status === 'IN_PROGRESS') return 'Syncing';
  if (status === 'FAILED') return 'Attention';
  if (status === 'DISABLED') return 'Disabled';
  if (status === 'PENDING') return 'Pending';
  return 'Status unavailable';
}
