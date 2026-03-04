import { useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { supervisorApi } from '../api/supervisorApi';
import type { SupervisorProjectSummary } from '../types';

type SupervisorProjectsState = {
  projects: SupervisorProjectSummary[];
  isLoading: boolean;
  error: ApiError | null;
};

export function useSupervisorProjects() {
  const [state, setState] = useState<SupervisorProjectsState>({
    projects: [],
    isLoading: true,
    error: null,
  });

  async function loadProjects() {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const projects = await supervisorApi.getProjects();
      setState({
        projects,
        isLoading: false,
        error: null,
      });
    } catch (error) {
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
    reload: loadProjects,
  };
}
