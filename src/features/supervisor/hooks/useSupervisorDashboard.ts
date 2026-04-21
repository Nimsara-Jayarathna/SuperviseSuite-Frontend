import { useCallback, useEffect, useRef, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { registerSessionCacheClearer } from '@/services/sessionCache';
import { supervisorApi } from '../api/supervisorApi';
import type { SupervisorDashboard } from '../types';
import { getSessionVersion, isCurrentSession } from '@/services/sessionState';

type SupervisorDashboardState = {
  dashboard: SupervisorDashboard | null;
  isLoading: boolean;
  error: ApiError | null;
};

let cachedDashboard: SupervisorDashboard | null = null;
let inFlightDashboardRequest: Promise<SupervisorDashboard> | null = null;

const UNKNOWN_ERROR_BASE: ApiError = {
  code: 'INTERNAL_ERROR',
  message: 'Unable to load dashboard right now.',
  details: [],
  timestamp: new Date().toISOString(),
  status: 0,
  error: 'Unexpected Error',
  path: '',
  traceId: null,
};

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

  const latestRequestId = useRef(0);

  const loadDashboard = useCallback(async (forceRefresh = false) => {
    const requestSessionVersion = getSessionVersion();
    const requestId = (latestRequestId.current += 1);

    const normalizeDashboardError = (error: unknown): ApiError => {
      if (isApiException(error)) {
        return error.apiError;
      }

      return {
        ...UNKNOWN_ERROR_BASE,
        timestamp: new Date().toISOString(),
      };
    };

    const applyDashboardSuccess = (dashboard: SupervisorDashboard) => {
      setState({
        dashboard,
        isLoading: false,
        error: null,
      });
    };

    const applyDashboardError = (error: unknown) => {
      setState({
        dashboard: null,
        isLoading: false,
        error: normalizeDashboardError(error),
      });
    };

    if (!forceRefresh && cachedDashboard) {
      if (!isCurrentSession(requestSessionVersion)) {
        return;
      }

      applyDashboardSuccess(cachedDashboard);
      return;
    }

    const request =
      !forceRefresh && inFlightDashboardRequest
        ? inFlightDashboardRequest
        : (inFlightDashboardRequest = supervisorApi.getDashboard());

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const dashboard = await request;
      const shouldCommitCache = inFlightDashboardRequest === request;
      if (shouldCommitCache) {
        cachedDashboard = dashboard;
      }

      if (!isCurrentSession(requestSessionVersion)) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info('[useSupervisorDashboard] discarded stale response');
        }
        if (latestRequestId.current === requestId) {
          setState((current) => ({ ...current, isLoading: false }));
        }
        return;
      }

      if (latestRequestId.current === requestId) {
        applyDashboardSuccess(dashboard);
      }
    } catch (error) {
      if (!isCurrentSession(requestSessionVersion)) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info('[useSupervisorDashboard] discarded stale error');
        }
        if (latestRequestId.current === requestId) {
          setState((current) => ({ ...current, isLoading: false }));
        }
        return;
      }

      if (latestRequestId.current === requestId) {
        applyDashboardError(error);
      }
    } finally {
      if (inFlightDashboardRequest === request) {
        inFlightDashboardRequest = null;
      }
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return {
    dashboard: state.dashboard,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadDashboard(true),
  };
}
