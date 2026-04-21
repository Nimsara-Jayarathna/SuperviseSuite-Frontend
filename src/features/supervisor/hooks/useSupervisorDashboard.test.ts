import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type { SupervisorDashboard } from '../types';

vi.mock('@/services/sessionCache', () => ({
  registerSessionCacheClearer: () => () => {},
}));

vi.mock('@/services/sessionState', () => ({
  getSessionVersion: () => 0,
  isCurrentSession: () => true,
}));

vi.mock('../api/supervisorApi', () => ({
  supervisorApi: {
    getDashboard: vi.fn(),
  },
}));

import { supervisorApi } from '../api/supervisorApi';
import {
  invalidateSupervisorDashboardCache,
  useSupervisorDashboard,
} from './useSupervisorDashboard';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function buildDashboard(overrides?: Partial<SupervisorDashboard>): SupervisorDashboard {
  return {
    totalProjects: 1,
    planningProjects: 0,
    activeProjects: 1,
    atRiskProjects: 0,
    behindProjects: 0,
    completedProjects: 0,
    upcomingMilestonesCount: 0,
    jiraAtRiskCount: 0,
    jiraBehindCount: 0,
    projects: [],
    recentProjects: [],
    ...overrides,
  };
}

describe('useSupervisorDashboard', () => {
  const dummyError: ApiError = {
    code: 'ERROR',
    message: 'Test error',
    details: [],
    timestamp: '2026-04-21T00:00:00Z',
    status: 400,
    error: 'Bad Request',
    path: '/api/supervisor/dashboard',
    traceId: null,
  };

  beforeEach(() => {
    invalidateSupervisorDashboardCache();
    vi.clearAllMocks();
  });

  it('loads dashboard successfully', async () => {
    (supervisorApi.getDashboard as Mock).mockResolvedValue(buildDashboard({ totalProjects: 5 }));

    const { result } = renderHook(() => useSupervisorDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.dashboard?.totalProjects).toBe(5);
  });

  it('maps ApiException into error state and clears loading', async () => {
    (supervisorApi.getDashboard as Mock).mockRejectedValue(new ApiException(dummyError));

    const { result } = renderHook(() => useSupervisorDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dashboard).toBeNull();
    expect(result.current.error).toEqual(dummyError);
  });

  it('shares an in-flight request between hook instances (success)', async () => {
    const gate = deferred<SupervisorDashboard>();
    (supervisorApi.getDashboard as Mock).mockReturnValue(gate.promise);

    const hookA = renderHook(() => useSupervisorDashboard());

    await waitFor(() => {
      expect(supervisorApi.getDashboard).toHaveBeenCalledTimes(1);
    });

    const hookB = renderHook(() => useSupervisorDashboard());

    await waitFor(() => {
      expect(supervisorApi.getDashboard).toHaveBeenCalledTimes(1);
      expect(hookA.result.current.isLoading).toBe(true);
      expect(hookB.result.current.isLoading).toBe(true);
    });

    gate.resolve(buildDashboard({ totalProjects: 2 }));

    await waitFor(() => {
      expect(hookA.result.current.isLoading).toBe(false);
      expect(hookB.result.current.isLoading).toBe(false);
    });

    expect(hookA.result.current.dashboard?.totalProjects).toBe(2);
    expect(hookB.result.current.dashboard?.totalProjects).toBe(2);
  });

  it('shares an in-flight request between hook instances (failure) and allows retry', async () => {
    const gate = deferred<SupervisorDashboard>();
    (supervisorApi.getDashboard as Mock).mockReturnValueOnce(gate.promise);

    const hookA = renderHook(() => useSupervisorDashboard());

    await waitFor(() => {
      expect(supervisorApi.getDashboard).toHaveBeenCalledTimes(1);
    });

    const hookB = renderHook(() => useSupervisorDashboard());

    gate.reject(new ApiException(dummyError));

    await waitFor(() => {
      expect(hookA.result.current.isLoading).toBe(false);
      expect(hookB.result.current.isLoading).toBe(false);
    });

    expect(hookA.result.current.error).toEqual(dummyError);
    expect(hookB.result.current.error).toEqual(dummyError);

    (supervisorApi.getDashboard as Mock).mockResolvedValueOnce(
      buildDashboard({ totalProjects: 9 }),
    );

    await act(async () => {
      await hookA.result.current.reload();
    });

    await waitFor(() => {
      expect(hookA.result.current.isLoading).toBe(false);
    });

    expect(hookA.result.current.error).toBeNull();
    expect(hookA.result.current.dashboard?.totalProjects).toBe(9);
  });

  it('does not allow stale async results to override a newer reload', async () => {
    const gateA = deferred<SupervisorDashboard>();
    const gateB = deferred<SupervisorDashboard>();

    (supervisorApi.getDashboard as Mock)
      .mockReturnValueOnce(gateA.promise)
      .mockReturnValueOnce(gateB.promise);

    const { result } = renderHook(() => useSupervisorDashboard());

    await waitFor(() => {
      expect(supervisorApi.getDashboard).toHaveBeenCalledTimes(1);
    });

    act(() => {
      void result.current.reload();
    });

    await waitFor(() => {
      expect(supervisorApi.getDashboard).toHaveBeenCalledTimes(2);
    });

    gateA.resolve(buildDashboard({ totalProjects: 1 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    gateB.resolve(buildDashboard({ totalProjects: 3 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dashboard?.totalProjects).toBe(3);

    const hookC = renderHook(() => useSupervisorDashboard());
    expect(hookC.result.current.isLoading).toBe(false);
    expect(hookC.result.current.dashboard?.totalProjects).toBe(3);
  });
});
