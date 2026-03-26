import { useMemo } from 'react';
import { useProjectRepositories } from './useProjectRepositories';

export function useGitHubAccessSources(projectId: string | undefined) {
  const state = useProjectRepositories(projectId);

  const accessSources = useMemo(() => state.data?.accessSources ?? [], [state.data]);

  return {
    ...state,
    accessSources,
  };
}
