import { useCallback, useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type { JiraSprintProgress } from '../types';

type JiraSprintProgressState = {
  progress: JiraSprintProgress | null;
  isLoading: boolean;
  error: ApiError | null;
};

export function useJiraSprintProgress(
  fetcher: (projectId: string) => Promise<JiraSprintProgress>,
  projectId: string,
) {
  const [state, setState] = useState<JiraSprintProgressState>({
    progress: null,
    isLoading: true,
    error: null,
  });

  const loadProgress = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const progress = await fetcher(projectId);

      setState({
        progress,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        progress: null,
        isLoading: false,
        error: isApiException(error)
          ? error.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to load Jira sprint progress right now.',
              details: [],
              timestamp: new Date().toISOString(),
              status: 0,
              error: 'Unexpected Error',
              path: '',
              traceId: null,
            },
      });
    }
  }, [fetcher, projectId]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void loadProgress();
  }, [loadProgress, projectId]);

  return {
    progress: state.progress,
    isLoading: state.isLoading,
    error: state.error,
    reload: loadProgress,
  };
}
