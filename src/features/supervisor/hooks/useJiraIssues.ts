import { useCallback, useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type { JiraIssueSummary } from '../types';

type JiraIssuesState = {
  issues: JiraIssueSummary[] | null;
  isLoading: boolean;
  error: ApiError | null;
};

/**
 * Loads the flat Jira issue list for a single project.
 *
 * Accepts the fetcher as a parameter so the same hook works for both the
 * supervisor and student features — the caller passes the appropriate API
 * function and the hook handles loading state, error normalisation, and reload.
 *
 * Usage:
 *   // Supervisor
 *   const { issues, isLoading, error, reload } = useJiraIssues(
 *     supervisorApi.getJiraIssues, projectId
 *   );
 *
 *   // Student
 *   const { issues, isLoading, error, reload } = useJiraIssues(
 *     studentApi.getJiraIssues, projectId
 *   );
 */
export function useJiraIssues(
  fetcher: (projectId: string) => Promise<JiraIssueSummary[]>,
  projectId: string,
) {
  const [state, setState] = useState<JiraIssuesState>({
    issues: null,
    isLoading: true,
    error: null,
  });

  const loadIssues = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const issues = await fetcher(projectId);
      setState({ issues, isLoading: false, error: null });
    } catch (error) {
      setState({
        issues: null,
        isLoading: false,
        error: isApiException(error)
          ? error.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to load Jira issues right now.',
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
    void loadIssues();
  }, [loadIssues, projectId]);

  return {
    issues: state.issues,
    isLoading: state.isLoading,
    error: state.error,
    reload: loadIssues,
  };
}
