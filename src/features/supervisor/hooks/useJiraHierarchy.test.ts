import { renderHook, waitFor } from '@testing-library/react';
import { useJiraHierarchy } from './useJiraHierarchy';
import { supervisorApi } from '../api/supervisorApi';
import type { JiraHierarchy } from '../types';

vi.mock('../api/supervisorApi', () => ({
  supervisorApi: {
    getProjectJiraHierarchy: vi.fn(),
  },
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts loading when projectId is provided and resolves to data', async () => {
    vi.mocked(supervisorApi.getProjectJiraHierarchy).mockResolvedValue(hierarchy);

    const { result } = renderHook(() => useJiraHierarchy('project-1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supervisorApi.getProjectJiraHierarchy).toHaveBeenCalledWith('project-1');
    expect(result.current.data).toEqual(hierarchy);
    expect(result.current.error).toBeNull();
  });

  it('sets error state when request fails', async () => {
    vi.mocked(supervisorApi.getProjectJiraHierarchy).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useJiraHierarchy('project-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error?.code).toBe('INTERNAL_ERROR');
    expect(result.current.error?.message).toBe('Unable to load Jira hierarchy.');
  });

  it('resets state when projectId is undefined', async () => {
    const { result } = renderHook(() => useJiraHierarchy(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supervisorApi.getProjectJiraHierarchy).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
