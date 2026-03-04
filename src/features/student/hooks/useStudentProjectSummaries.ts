import { useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { studentApi } from '../api/studentApi';
import type { StudentProjectSummary } from '../types';

type StudentProjectSummariesState = {
  projects: StudentProjectSummary[];
  isLoading: boolean;
  error: ApiError | null;
};

export function useStudentProjectSummaries() {
  const [state, setState] = useState<StudentProjectSummariesState>({
    projects: [],
    isLoading: true,
    error: null,
  });

  async function loadProjects() {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const projects = await studentApi.getProjects();
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
    let isCancelled = false;
    setState((current) => ({ ...current, isLoading: true, error: null }));

    void studentApi
      .getProjects()
      .then((projects) => {
        if (isCancelled) {
          return;
        }
        setState({
          projects,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (isCancelled) {
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
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    projects: state.projects,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadProjects(),
  };
}
