import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from '@/types';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import type { ProjectGitHubRepositories } from '../types';

type UseProjectRepositoriesState = {
  data: ProjectGitHubRepositories | null;
  isLoading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
};

export function useProjectRepositories(projectId: string | undefined): UseProjectRepositoriesState {
  const [data, setData] = useState<ProjectGitHubRepositories | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const reload = useCallback(async () => {
    if (!projectId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const project = await supervisorApi.getProjectById(projectId);
      setData(project.githubRepositories ?? null);
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
            message: 'Unable to load project repositories right now.',
            path: `/api/supervisor/projects/${projectId}`,
            traceId: null,
            details: [],
          },
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, isLoading, error, reload };
}
