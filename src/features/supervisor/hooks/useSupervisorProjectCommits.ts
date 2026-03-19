// SuperviseSuite-Frontend/src/features/supervisor/hooks/useSupervisorProjectCommits.ts
import { useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { supervisorApi } from '../api/supervisorApi';
import type { ProjectCommitActivity } from '../types';

type SupervisorProjectCommitsState = {
  data: ProjectCommitActivity | null;
  isLoading: boolean;
  error: ApiError | null;
};

export function useSupervisorProjectCommits(projectId: string | undefined) {
  const [state, setState] = useState<SupervisorProjectCommitsState>({
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
      const data = await supervisorApi.getProjectCommits(projectId, forceRefresh);
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
              message: 'Unable to load commit activity right now.',
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

    void supervisorApi
      .getProjectCommits(projectId)
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
                message: 'Unable to load commit activity right now.',
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