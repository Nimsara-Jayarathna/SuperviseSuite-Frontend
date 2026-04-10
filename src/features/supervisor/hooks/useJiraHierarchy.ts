import { useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { supervisorApi } from '../api/supervisorApi';
import type { JiraHierarchy } from '../types';

type HierarchyState = {
  data: JiraHierarchy | null;
  isLoading: boolean;
  error: ApiError | null;
};

export function useJiraHierarchy(projectId: string | undefined) {
  const [state, setState] = useState<HierarchyState>({
    data: null,
    isLoading: Boolean(projectId),
    error: null,
  });

  useEffect(() => {
    if (!projectId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    supervisorApi
      .getProjectJiraHierarchy(projectId)
      .then((data) => {
        if (!cancelled) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

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
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return state;
}
