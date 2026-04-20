import { useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { registerSessionCacheClearer } from '@/services/sessionCache';
import { supervisorApi } from '../api/supervisorApi';
import type { SupervisorDashboard } from '../types';

type SupervisorDashboardState = {
  dashboard: SupervisorDashboard | null;
  isLoading: boolean;
  error: ApiError | null;
};

let cachedDashboard: SupervisorDashboard | null = null;
let inFlightDashboardRequest: Promise<SupervisorDashboard> | null = null;

export function invalidateSupervisorDashboardCache() {
  cachedDashboard = null;
  inFlightDashboardRequest = null;
}

registerSessionCacheClearer(invalidateSupervisorDashboardCache);

export function useSupervisorDashboard() {
  const [state, setState] = useState<SupervisorDashboardState>({
    dashboard: cachedDashboard,
    isLoading: cachedDashboard ? false : true,
    error: null,
  });

  async function loadDashboard(forceRefresh = false) {
    if (!forceRefresh && cachedDashboard) {
      setState({
        dashboard: cachedDashboard,
        isLoading: false,
        error: null,
      });
      return;
    }

    if (!forceRefresh && inFlightDashboardRequest) {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const dashboard = await inFlightDashboardRequest;
      setState({
        dashboard,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      inFlightDashboardRequest = supervisorApi.getDashboard();
      const dashboard = await inFlightDashboardRequest;
      cachedDashboard = dashboard;
      inFlightDashboardRequest = null;

      setState({
        dashboard,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      inFlightDashboardRequest = null;
      setState({
        dashboard: null,
        isLoading: false,
        error: isApiException(error)
          ? error.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to load dashboard right now.',
              details: [],
              timestamp: new Date().toISOString(),
              status: 0,
              error: 'Unexpected Error',
              path: '',
              traceId: null,
            },
      });
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return {
    dashboard: state.dashboard,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadDashboard(true),
  };
}
