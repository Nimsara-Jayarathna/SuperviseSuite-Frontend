import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supervisorApi } from '../api/supervisorApi';
import { useGitHubAccessUpdatedQuery } from './githubAccessUpdated/useGitHubAccessUpdatedQuery';
import { useGitHubAccessUpdatedSummaryState } from './githubAccessUpdated/useGitHubAccessUpdatedSummaryState';

function toScopeLabel(scope: string | null | undefined, count: number | null | undefined): string {
  if (scope === 'SINGLE_REPOSITORY') {
    return 'Single repository access';
  }
  if (scope === 'MULTIPLE_REPOSITORIES') {
    return `Multiple repositories access${typeof count === 'number' ? ` (${count})` : ''}`;
  }
  if (scope === 'NO_REPOSITORIES') {
    return 'No repositories selected on GitHub';
  }
  return 'Repository access updated';
}

export function useGitHubAccessUpdatedPageState() {
  const navigate = useNavigate();

  const { token, projectId, sourceId, flowType, setupStatus } = useGitHubAccessUpdatedQuery();
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const showFailedStatus = setupStatus.toLowerCase() === 'failed';
  const { summary, status, title, message, loadSummary } = useGitHubAccessUpdatedSummaryState({
    token,
    projectId,
    showFailedStatus,
    api: {
      getPublicGitHubAccessUpdatedSummary: supervisorApi.getPublicGitHubAccessUpdatedSummary,
      getProjectGitHubAccessUpdatedSummary: supervisorApi.getProjectGitHubAccessUpdatedSummary,
    },
  });

  const onClose =
    status === 'loading'
      ? undefined
      : () => navigate(projectId ? `/supervisor/projects/${projectId}` : '/', { replace: true });

  const onRetry = status === 'error' && (token || projectId) ? () => void loadSummary() : undefined;

  async function handleConfirmAndContinue() {
    const resolvedProjectId = projectId || summary?.projectId || '';
    if (!resolvedProjectId) {
      navigate('/', { replace: true });
      return;
    }

    const resolvedSourceId = sourceId || summary?.sourceId || '';
    const resolvedFlowType =
      flowType || summary?.flowType || (token ? 'INSTALLATION_REQUESTED' : 'INSTALLATION_DIRECT');

    const nextParams = new URLSearchParams();
    nextParams.set('githubSetup', 'success');
    nextParams.set('tab', 'overview');
    nextParams.set('githubAccessUpdated', 'true');
    if (resolvedSourceId) {
      nextParams.set('githubSourceId', resolvedSourceId);
    }
    if (resolvedFlowType) {
      nextParams.set('githubFlow', resolvedFlowType);
    }

    setIsAcknowledging(true);
    navigate(`/supervisor/projects/${resolvedProjectId}?${nextParams.toString()}`, {
      replace: true,
    });
  }

  const scopeLabel = useMemo(() => {
    if (!summary) return null;
    return toScopeLabel(summary.accessScope, summary.accessibleRepositoryCount);
  }, [summary]);

  return {
    summary,
    status,
    title,
    message,
    isAcknowledging,
    onClose,
    onRetry,
    scopeLabel,
    handleConfirmAndContinue,
  };
}
