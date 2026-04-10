import { useCallback, useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type { JiraWorkload } from '../types';

type JiraWorkloadState = {
  workload: JiraWorkload | null;
  isLoading: boolean;
  error: ApiError | null;
};

/**
 * Loads Jira team workload data for a single project.
 *
 * Accepts the fetcher as a parameter so the same hook works for both the
 * supervisor and student features — the caller passes the appropriate API
 * function and the hook handles loading state, error normalisation, and reload.
 *
 * The `applyWorkload` callback lets the caller inject fresh data without a
 * second network round-trip — used by the supervisor panel after a Jira Refresh
 * to update the workload view from the already-fetched response.
 *
 * Usage:
 *   // Supervisor
 *   const { workload, isLoading, error, reload, applyWorkload } = useJiraWorkload(
 *     supervisorApi.getJiraWorkload, projectId
 *   );
 *
 *   // Student (read-only — applyWorkload not needed)
 *   const { workload, isLoading, error, reload } = useJiraWorkload(
 *     studentApi.getJiraWorkload, projectId
 *   );
 */
export function useJiraWorkload(
  fetcher: (projectId: string) => Promise<JiraWorkload>,
  projectId: string,
) {
  const [state, setState] = useState<JiraWorkloadState>({
    workload: null,
    isLoading: true,
    error: null,
  });

  const loadWorkload = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const workload = await fetcher(projectId);

      setState({
        workload,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        workload: null,
        isLoading: false,
        error: isApiException(error)
          ? error.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to load Jira team workload data right now.',
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
    void loadWorkload();
  }, [loadWorkload, projectId]);

  /**
   * Directly injects a {@link JiraWorkload} into state without a network
   * request. Used by the supervisor panel to update the workload view after a
   * Jira Refresh that already returns fresh data from the server.
   */
  const applyWorkload = useCallback((workload: JiraWorkload) => {
    setState({
      workload,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    workload: state.workload,
    isLoading: state.isLoading,
    error: state.error,
    reload: loadWorkload,
    applyWorkload,
  };
}
