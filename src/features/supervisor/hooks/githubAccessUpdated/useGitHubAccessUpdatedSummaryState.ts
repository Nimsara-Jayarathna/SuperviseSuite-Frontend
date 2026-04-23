import { useCallback, useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { GitHubAccessUpdatedSummary } from '../../types';

const INVALID_LINK_MESSAGE =
  'This access request link is invalid or has expired. Please create a new access request from the project.';

type UseGitHubAccessUpdatedSummaryStateParams = {
  token: string;
  projectId: string;
  showFailedStatus: boolean;
  api: {
    getPublicGitHubAccessUpdatedSummary: (token: string) => Promise<GitHubAccessUpdatedSummary>;
    getProjectGitHubAccessUpdatedSummary: (
      projectId: string,
    ) => Promise<GitHubAccessUpdatedSummary>;
  };
};

export function useGitHubAccessUpdatedSummaryState({
  token,
  projectId,
  showFailedStatus,
  api,
}: UseGitHubAccessUpdatedSummaryStateParams) {
  const { getPublicGitHubAccessUpdatedSummary, getProjectGitHubAccessUpdatedSummary } = api;
  const [summary, setSummary] = useState<GitHubAccessUpdatedSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [title, setTitle] = useState('Finalizing GitHub access update');
  const [message, setMessage] = useState(
    'Verifying callback state and loading updated repository access summary.',
  );

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
        ? await getPublicGitHubAccessUpdatedSummary(token)
        : await getProjectGitHubAccessUpdatedSummary(projectId);
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
  }, [getProjectGitHubAccessUpdatedSummary, getPublicGitHubAccessUpdatedSummary, projectId, token]);

  useEffect(() => {
    if (showFailedStatus && !token && !projectId) {
      setSummary(null);
      setStatus('error');
      setTitle('GitHub access update failed');
      setMessage('GitHub authorization did not complete. Please create a new access request.');
      return;
    }
    void loadSummary();
  }, [loadSummary, projectId, showFailedStatus, token]);

  return { summary, status, title, message, loadSummary };
}
