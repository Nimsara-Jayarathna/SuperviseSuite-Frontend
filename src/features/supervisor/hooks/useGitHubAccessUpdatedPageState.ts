import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import type { GitHubAccessUpdatedSummary } from '../types';

const INVALID_LINK_MESSAGE =
  'This access request link is invalid or has expired. Please create a new access request from the project.';

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const projectId = useMemo(() => searchParams.get('projectId')?.trim() ?? '', [searchParams]);
  const sourceId = useMemo(() => searchParams.get('sourceId')?.trim() ?? '', [searchParams]);
  const flowType = useMemo(() => searchParams.get('flowType')?.trim() ?? '', [searchParams]);
  const setupStatus = useMemo(() => searchParams.get('status')?.trim() ?? '', [searchParams]);

  const [summary, setSummary] = useState<GitHubAccessUpdatedSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [title, setTitle] = useState('Finalizing GitHub access update');
  const [message, setMessage] = useState(
    'Verifying callback state and loading updated repository access summary.',
  );
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const showFailedStatus = setupStatus.toLowerCase() === 'failed';

  const loadSummary = useCallback(async () => {
    if (!token && !projectId) {
      setSummary(null);
      setStatus('error');
      setTitle('GitHub access update failed');
      setMessage(INVALID_LINK_MESSAGE);
      return;
    }

    setStatus('loading');
    setTitle('Finalizing GitHub access update');
    setMessage('Verifying callback state and loading updated repository access summary.');

    try {
      const data = token
        ? await supervisorApi.getPublicGitHubAccessUpdatedSummary(token)
        : await supervisorApi.getProjectGitHubAccessUpdatedSummary(projectId);
      setSummary(data);
      setStatus('success');
      setTitle('GitHub access updated successfully');
      setMessage(
        token
          ? 'Your available repositories have been refreshed. You can remove repository access anytime from GitHub App settings.'
          : `GitHub access for project "${data.projectTitle}" has been refreshed. Please confirm the details below.`,
      );
    } catch (error) {
      const nextMessage = isApiException(error) ? error.apiError.message : INVALID_LINK_MESSAGE;
      setSummary(null);
      setStatus('error');
      setTitle('GitHub access update failed');
      setMessage(nextMessage || INVALID_LINK_MESSAGE);
    }
  }, [projectId, token]);

  useEffect(() => {
    if (showFailedStatus && !token && !projectId) {
      setSummary(null);
      setStatus('error');
      setTitle('GitHub access update failed');
      setMessage('GitHub authorization did not complete. Please create a new access request.');
      return;
    }
    void loadSummary();
  }, [showFailedStatus, token, projectId, loadSummary]);

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
