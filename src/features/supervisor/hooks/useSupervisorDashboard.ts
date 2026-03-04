import { useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { supervisorApi } from '../api/supervisorApi';
import type { SupervisorDashboard } from '../types';

type SupervisorDashboardState = {
  dashboard: SupervisorDashboard | null;
  isLoading: boolean;
  error: ApiError | null;
};

export function useSupervisorDashboard() {
  const [state, setState] = useState<SupervisorDashboardState>({
    dashboard: null,
    isLoading: true,
    error: null,
  });

  async function loadDashboard() {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const dashboard = await supervisorApi.getDashboard();

      setState({
        dashboard,
        isLoading: false,
        error: null,
      });
    } catch (error) {
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
    reload: () => loadDashboard(),
  };
}
