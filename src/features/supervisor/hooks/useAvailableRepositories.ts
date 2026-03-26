import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from '@/types';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import type { GitHubAvailableRepositories } from '../types';

type UseAvailableRepositoriesState = {
  data: GitHubAvailableRepositories | null;
  isLoading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
};

export function useAvailableRepositories(sourceId: string | null): UseAvailableRepositoriesState {
  const [data, setData] = useState<GitHubAvailableRepositories | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const reload = useCallback(async () => {
    if (!sourceId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const next = await supervisorApi.getAvailableGitHubRepositories(sourceId);
      setData(next);
    } catch (loadError) {
      setData(null);
      setError(
        isApiException(loadError)
          ? loadError.apiError
          : {
              timestamp: new Date().toISOString(),
              status: 500,
              error: 'Internal Server Error',
              code: 'INTERNAL_ERROR',
              message: 'Unable to load available repositories right now.',
              path: '/api/github/repositories/available',
              traceId: null,
              details: [],
            },
      );
    } finally {
      setIsLoading(false);
    }
  }, [sourceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, isLoading, error, reload };
}
