import { act, renderHook, waitFor } from '@testing-library/react';
import { useJiraHierarchy } from './useJiraHierarchy';
import type { JiraHierarchy } from '../types';

const hierarchy: JiraHierarchy = {
  roots: [
    {
      issueKey: 'PRJ-1',
      summary: 'Epic 1',
      issueType: 'Epic',
      status: 'To Do',
      priority: 'Medium',
      assigneeDisplayName: null,
      storyPoints: null,
      children: [],
    },
  ],
  orphans: [],
};

describe('useJiraHierarchy', () => {
  it('loads lazily when load is called', async () => {
    const fetcher = vi.fn().mockResolvedValue(hierarchy);

    const { result } = renderHook(() => useJiraHierarchy(fetcher, 'project-1'));

    expect(result.current.isLoading).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.load();
    });

    expect(fetcher).toHaveBeenCalledWith('project-1');
    expect(result.current.data).toEqual(hierarchy);
    expect(result.current.hasLoaded).toBe(true);
  });

  it('loads immediately when lazy is false', async () => {
    const fetcher = vi.fn().mockResolvedValue(hierarchy);

    const { result } = renderHook(() => useJiraHierarchy(fetcher, 'project-1', false));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledWith('project-1');
    expect(result.current.data).toEqual(hierarchy);
  });

  it('maps unexpected errors to INTERNAL_ERROR', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useJiraHierarchy(fetcher, 'project-1', false));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error?.code).toBe('INTERNAL_ERROR');
    expect(result.current.error?.message).toBe('Unable to load Jira hierarchy.');
  });
});
