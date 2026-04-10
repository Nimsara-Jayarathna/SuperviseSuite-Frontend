import { useCallback, useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type { JiraHierarchy } from '../types';

type HierarchyState = {
  data: JiraHierarchy | null;
  isLoading: boolean;
  error: ApiError | null;
};

/**
 * Loads Jira hierarchy data for a project.
 *
 * Accepts the fetcher as a parameter so the same hook works for both the
 * supervisor and student features - the caller passes the appropriate API
 * function.
 *
 * Pass `lazy={true}` (default) to defer the fetch until `load()` is called
 * explicitly. Pass `lazy={false}` to fire immediately on mount.
 */
export function useJiraHierarchy(
  fetcher: (projectId: string) => Promise<JiraHierarchy>,
  projectId: string,
  lazy = true,
) {
  const [state, setState] = useState<HierarchyState>({
    data: null,
    isLoading: false,
    error: null,
  });
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetcher(projectId);
      setState({ data, isLoading: false, error: null });
      setHasLoaded(true);
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: isApiException(err)
          ? err.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to load Jira hierarchy.',
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
    if (!lazy && projectId) {
      void load();
    }
  }, [lazy, load, projectId]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    hasLoaded,
    load,
  };
}
