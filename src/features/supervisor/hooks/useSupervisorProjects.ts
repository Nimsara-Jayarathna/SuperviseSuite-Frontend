import { useEffect, useState } from 'react';
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

  async function loadProjects(forceRefresh = false) {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    const requestSessionVersion = getSessionVersion();

    try {
      if (!forceRefresh && cachedProjects) {
        if (!isCurrentSession(requestSessionVersion)) {
          return;
        }

        setState({
          projects: cachedProjects,
          isLoading: false,
          error: null,
        });
        return;
      }

      if (!forceRefresh && inFlightProjectsRequest) {
        const projects = await inFlightProjectsRequest;
        if (!isCurrentSession(requestSessionVersion)) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.info('[useSupervisorProjects] discarded stale in-flight response');
          }
          return;
        }

        setState({
          projects,
          isLoading: false,
          error: null,
        });
        return;
      }

      inFlightProjectsRequest = supervisorApi.getProjects();
      const projects = await inFlightProjectsRequest;
      cachedProjects = projects;
      inFlightProjectsRequest = null;

      if (!isCurrentSession(requestSessionVersion)) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info('[useSupervisorProjects] discarded stale response');
        }
        return;
      }

      setState({
        projects,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      inFlightProjectsRequest = null;
      if (!isCurrentSession(requestSessionVersion)) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info('[useSupervisorProjects] discarded stale error');
        }
        return;
      }

      setState({
        projects: [],
        isLoading: false,
        error: isApiException(error)
          ? error.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to load projects right now.',
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
    void loadProjects();
  }, []);

  return {
    projects: state.projects,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadProjects(true),
  };
}
