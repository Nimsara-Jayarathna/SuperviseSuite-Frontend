import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateSupervisorProjectsCache, useSupervisorProjects } from './useSupervisorProjects';

const getProjects = vi.hoisted(() => vi.fn());
const getSessionVersion = vi.hoisted(() => vi.fn(() => 1));
const isCurrentSession = vi.hoisted(() => vi.fn(() => true));

vi.mock('../api/supervisorApi', () => ({
  supervisorApi: {
    getProjects,
  },
}));

vi.mock('@/services/sessionState', () => ({
  getSessionVersion,
  isCurrentSession,
}));

describe('useSupervisorProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateSupervisorProjectsCache();
    getSessionVersion.mockReturnValue(1);
    isCurrentSession.mockReturnValue(true);
  });

  it('does not commit stale response from previous session version', async () => {
    getProjects.mockResolvedValueOnce([{ id: 'a', title: 'User A Project' }]);
    isCurrentSession.mockReturnValue(false);

    const { result } = renderHook(() => useSupervisorProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
  });

  it('loads projects when session is current', async () => {
    getProjects.mockResolvedValueOnce([{ id: 'b', title: 'User B Project' }]);

    const { result } = renderHook(() => useSupervisorProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([{ id: 'b', title: 'User B Project' }]);
  });
});
