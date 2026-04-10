import { useCallback, useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type { JiraHealth } from '../types';

type JiraHealthState = {
  health: JiraHealth | null;
  isLoading: boolean;
  error: ApiError | null;
};

/**
 * Loads Jira health data for a single project.
 *
 * Accepts the fetcher as a parameter so the same hook works for both the
 * supervisor and student features — the caller passes the appropriate API
 * function and the hook handles loading state, error normalisation, and reload.
 *
 * Usage:
 *   // Supervisor
 *   const { health, isLoading, error, reload } = useJiraHealth(
 *     supervisorApi.getJiraHealth, projectId
 *   );
 *
 *   // Student
 *   const { health, isLoading, error, reload } = useJiraHealth(
 *     studentApi.getJiraHealth, projectId
 *   );
 */
export function useJiraHealth(
  fetcher: (projectId: string) => Promise<JiraHealth>,
  projectId: string,
) {
  const [state, setState] = useState<JiraHealthState>({
    health: null,
    isLoading: true,
    error: null,
  });

  const loadHealth = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const health = await fetcher(projectId);

      setState({
        health,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        health: null,
        isLoading: false,
        error: isApiException(error)
          ? error.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to load Jira health data right now.',
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
    if (!projectId) return;
    void loadHealth();
  }, [loadHealth, projectId]);

  const applyHealth = useCallback((health: JiraHealth) => {
    setState({
      health,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    health: state.health,
    isLoading: state.isLoading,
    error: state.error,
    reload: loadHealth,
    applyHealth,
  };
}
