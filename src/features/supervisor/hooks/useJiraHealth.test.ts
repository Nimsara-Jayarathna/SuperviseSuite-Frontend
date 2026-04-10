import { act, renderHook, waitFor } from '@testing-library/react';
import { useJiraHealth } from './useJiraHealth';
import type { JiraHealth } from '../types';

const healthA: JiraHealth = {
  completionPercent: 75,
  openIssues: 4,
  overdueIssues: 1,
  highPriorityOpen: 1,
  statusBreakdown: {
    toDo: 2,
    inProgress: 2,
    done: 12,
  },
  typeDistribution: [
    { type: 'Task', count: 8 },
    { type: 'Bug', count: 4 },
  ],
  bugRatio: 25,
  lastSyncedAt: '2026-04-07T18:10:00Z',
};

const healthB: JiraHealth = {
  ...healthA,
  completionPercent: 80,
  openIssues: 3,
  statusBreakdown: {
    toDo: 1,
    inProgress: 2,
    done: 13,
  },
};

describe('useJiraHealth', () => {
  it('loads Jira health on mount when projectId is provided', async () => {
    const fetcher = vi.fn().mockResolvedValue(healthA);

    const { result } = renderHook(() => useJiraHealth(fetcher, 'project-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledWith('project-1');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.health).toEqual(healthA);
  });

  it('does not call fetcher when projectId is empty', async () => {
    const fetcher = vi.fn().mockResolvedValue(healthA);

    const { result } = renderHook(() => useJiraHealth(fetcher, ''));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.health).toBeNull();
  });

  it('maps unexpected errors to INTERNAL_ERROR', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useJiraHealth(fetcher, 'project-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.health).toBeNull();
    expect(result.current.error?.code).toBe('INTERNAL_ERROR');
    expect(result.current.error?.message).toBe('Unable to load Jira health data right now.');
  });

  it('supports applyHealth for immediate UI updates', async () => {
    const fetcher = vi.fn().mockResolvedValue(healthA);

    const { result } = renderHook(() => useJiraHealth(fetcher, 'project-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.applyHealth(healthB);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.health).toEqual(healthB);
  });

  it('reload fetches health again and updates state', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(healthA).mockResolvedValueOnce(healthB);

    const { result } = renderHook(() => useJiraHealth(fetcher, 'project-1'));

    await waitFor(() => {
      expect(result.current.health).toEqual(healthA);
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.health).toEqual(healthB);
    expect(result.current.error).toBeNull();
  });
});
