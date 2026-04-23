import { useCallback, useEffect, useRef, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { supervisorApi } from '../api/supervisorApi';
import type { SupervisorProjectSummary } from '../types';
import { getSessionVersion, isCurrentSession } from '@/services/sessionState';
import { registerSessionCacheClearer } from '@/services/sessionCache';

type SupervisorProjectsState = {
  projects: SupervisorProjectSummary[];
  isLoading: boolean;
  error: ApiError | null;
};

let cachedProjects: SupervisorProjectSummary[] | null = null;
let inFlightProjectsRequest: Promise<SupervisorProjectSummary[]> | null = null;

const UNKNOWN_ERROR_BASE: ApiError = {
  code: 'INTERNAL_ERROR',
  message: 'Unable to load projects right now.',
  details: [],
  timestamp: new Date().toISOString(),
  status: 0,
  error: 'Unexpected Error',
  path: '',
  traceId: null,
};

export function invalidateSupervisorProjectsCache() {
  cachedProjects = null;
  inFlightProjectsRequest = null;
}

registerSessionCacheClearer(invalidateSupervisorProjectsCache);

export function useSupervisorProjects() {
  const [state, setState] = useState<SupervisorProjectsState>({
    projects: [],
    isLoading: true,
    error: null,
  });

  const latestRequestId = useRef(0);

  const loadProjects = useCallback(async (forceRefresh = false) => {
    const requestSessionVersion = getSessionVersion();
    const requestId = (latestRequestId.current += 1);
    let request: Promise<SupervisorProjectSummary[]> | null = null;

    const normalizeProjectsError = (error: unknown): ApiError => {
      if (isApiException(error)) {
        return error.apiError;
      }

      return {
        ...UNKNOWN_ERROR_BASE,
        timestamp: new Date().toISOString(),
      };
    };

    const applyProjectsSuccess = (projects: SupervisorProjectSummary[]) => {
      setState({
        projects,
        isLoading: false,
        error: null,
      });
    };

    const applyProjectsError = (error: unknown) => {
      setState({
        projects: [],
        isLoading: false,
        error: normalizeProjectsError(error),
      });
    };

    try {
      if (!forceRefresh && cachedProjects) {
        if (!isCurrentSession(requestSessionVersion)) {
          return;
        }
        applyProjectsSuccess(cachedProjects);
        return;
      }

      request =
        !forceRefresh && inFlightProjectsRequest
          ? inFlightProjectsRequest
          : (inFlightProjectsRequest = supervisorApi.getProjects());

      setState((current) => ({ ...current, isLoading: true, error: null }));

      const projects = await request;
      const shouldCommitCache = inFlightProjectsRequest === request;
      if (shouldCommitCache) {
        cachedProjects = projects;
      }

      if (!isCurrentSession(requestSessionVersion)) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info('[useSupervisorProjects] discarded stale response');
        }
        if (latestRequestId.current === requestId) {
          setState((current) => ({ ...current, isLoading: false }));
        }
        return;
      }

      if (latestRequestId.current === requestId) {
        applyProjectsSuccess(projects);
      }
    } catch (error) {
      if (!isCurrentSession(requestSessionVersion)) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info('[useSupervisorProjects] discarded stale error');
        }
        if (latestRequestId.current === requestId) {
          setState((current) => ({ ...current, isLoading: false }));
        }
        return;
      }

      if (latestRequestId.current === requestId) {
        applyProjectsError(error);
      }
    } finally {
      if (request && inFlightProjectsRequest === request) {
        inFlightProjectsRequest = null;
      }
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return {
    projects: state.projects,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadProjects(true),
  };
}
