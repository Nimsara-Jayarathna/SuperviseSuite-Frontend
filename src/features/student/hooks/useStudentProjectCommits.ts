// SuperviseSuite-Frontend/src/features/student/hooks/useStudentProjectCommits.ts
import { useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { studentApi } from '../api/studentApi';
import type { ProjectGitHubActivity } from '../types';

type StudentProjectCommitsState = {
  data: ProjectGitHubActivity | null;
  isLoading: boolean;
  error: ApiError | null;
};

export function useStudentProjectCommits(projectId: string | undefined) {
  const [state, setState] = useState<StudentProjectCommitsState>({
    data: null,
    isLoading: Boolean(projectId),
    error: null,
  });

  async function loadCommits(forceRefresh = false) {
    if (!projectId) {
      setState({
        data: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const data = await studentApi.getProjectGitHubDashboard(projectId, forceRefresh);
      setState({
        data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: isApiException(error)
          ? error.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to load GitHub dashboard right now.',
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
        data: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isCancelled = false;
    setState((current) => ({ ...current, isLoading: true, error: null }));

    void studentApi
      .getProjectGitHubDashboard(projectId)
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setState({
          data,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setState({
          data: null,
          isLoading: false,
          error: isApiException(error)
            ? error.apiError
            : {
                code: 'INTERNAL_ERROR',
                message: 'Unable to load GitHub dashboard right now.',
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
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    reload: () => loadCommits(true),
  };
}
