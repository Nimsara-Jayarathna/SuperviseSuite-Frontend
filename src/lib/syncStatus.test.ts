import { describe, expect, it } from 'vitest';
import { normalizeSyncStatus, toSyncHealthLabel, toSyncLabel } from './syncStatus';

describe('syncStatus', () => {
  it('normalizes known statuses', () => {
    expect(normalizeSyncStatus('SUCCESS')).toBe('SUCCESS');
    expect(normalizeSyncStatus('FAILED')).toBe('FAILED');
    expect(normalizeSyncStatus('PENDING')).toBe('PENDING');
    expect(normalizeSyncStatus('DISABLED')).toBe('DISABLED');
    expect(normalizeSyncStatus('IN_PROGRESS')).toBe('IN_PROGRESS');
  });

  it('normalizes nullish and unknown statuses', () => {
    expect(normalizeSyncStatus(null)).toBe('UNKNOWN');
    expect(normalizeSyncStatus(undefined)).toBe('UNKNOWN');
    expect(normalizeSyncStatus('SOMETHING_NEW')).toBe('UNKNOWN');
  });

  it('maps labels consistently', () => {
    expect(toSyncLabel('IN_PROGRESS')).toBe('Syncing');
    expect(toSyncLabel('SUCCESS')).toBe('Synced');
    expect(toSyncLabel('PENDING')).toBe('Pending');
    expect(toSyncLabel('FAILED')).toBe('Sync failed');
    expect(toSyncLabel('DISABLED')).toBe('Disabled');
    expect(toSyncLabel('UNKNOWN')).toBe('Status unavailable');
  });

  it('maps health labels consistently', () => {
    expect(toSyncHealthLabel('SUCCESS')).toBe('Healthy');
    expect(toSyncHealthLabel('IN_PROGRESS')).toBe('Syncing');
    expect(toSyncHealthLabel('PENDING')).toBe('Pending');
    expect(toSyncHealthLabel('FAILED')).toBe('Attention');
    expect(toSyncHealthLabel('DISABLED')).toBe('Disabled');
    expect(toSyncHealthLabel('UNKNOWN')).toBe('Status unavailable');
  });
});
