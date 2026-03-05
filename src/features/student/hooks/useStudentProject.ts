import { useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { studentApi } from '../api/studentApi';
import type { StudentProjectDetail } from '../types';

type StudentProjectState = {
  project: StudentProjectDetail | null;
  isLoading: boolean;
  error: ApiError | null;
};

export function useStudentProject(projectId: string | undefined) {
  const [state, setState] = useState<StudentProjectState>({
    project: null,
    isLoading: Boolean(projectId),
    error: null,
  });

  async function loadProject(forceRefresh = false) {
    if (!projectId) {
      setState({
        project: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const project = await studentApi.getProjectById(projectId, forceRefresh);
      setState({
        project,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        project: null,
        isLoading: false,
        error: isApiException(error)
          ? error.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to load the project right now.',
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
    if (!projectId) {
      setState({
        project: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isCancelled = false;
    setState((current) => ({ ...current, isLoading: true, error: null }));

    void studentApi
      .getProjectById(projectId)
      .then((project) => {
        if (isCancelled) {
          return;
        }

        setState({
          project,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setState({
          project: null,
          isLoading: false,
          error: isApiException(error)
            ? error.apiError
            : {
                code: 'INTERNAL_ERROR',
                message: 'Unable to load the project right now.',
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
  }, [projectId]);

  return {
    project: state.project,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadProject(true),
  };
}
