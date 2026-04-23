import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useGitHubAccessUpdatedQuery() {
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const projectId = useMemo(() => searchParams.get('projectId')?.trim() ?? '', [searchParams]);
  const sourceId = useMemo(() => searchParams.get('sourceId')?.trim() ?? '', [searchParams]);
  const flowType = useMemo(() => searchParams.get('flowType')?.trim() ?? '', [searchParams]);
  const setupStatus = useMemo(() => searchParams.get('status')?.trim() ?? '', [searchParams]);

  return { token, projectId, sourceId, flowType, setupStatus };
}
