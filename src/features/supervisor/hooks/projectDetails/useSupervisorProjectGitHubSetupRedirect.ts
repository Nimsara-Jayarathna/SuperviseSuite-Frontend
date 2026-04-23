import { useCallback, useEffect, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { parseGitHubSetupRedirect } from '../useGitHubSetupFlow';

type RefreshModalControls = {
  showError: (payload: { title: string; message: string; retryAction?: () => void }) => void;
};

type UseSupervisorProjectGitHubSetupRedirectParams = {
  projectId: string | undefined;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  refreshModal: RefreshModalControls;
};

export function useSupervisorProjectGitHubSetupRedirect({
  projectId,
  searchParams,
  setSearchParams,
  refreshModal,
}: UseSupervisorProjectGitHubSetupRedirectParams) {
  const [pendingGitHubSourceId, setPendingGitHubSourceId] = useState<string | null>(null);
  const [pendingGitHubFlowType, setPendingGitHubFlowType] = useState<
    'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED' | null
  >(null);

  const onPendingGitHubSourceHandled = useCallback(() => {
    setPendingGitHubSourceId(null);
    setPendingGitHubFlowType(null);
  }, []);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const redirectState = parseGitHubSetupRedirect(searchParams);
    if (!redirectState.setupStatus) {
      return;
    }

    if (redirectState.setupStatus === 'success') {
      if (redirectState.sourceId) {
        setPendingGitHubSourceId(redirectState.sourceId);
        setPendingGitHubFlowType(redirectState.flowType);
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('githubSetup');
      nextParams.delete('installationId');
      nextParams.delete('githubSourceId');
      nextParams.delete('githubFlow');
      nextParams.delete('githubAccessUpdated');
      nextParams.delete('tab');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    if (redirectState.setupStatus === 'failed') {
      refreshModal.showError({
        title: 'GitHub setup failed',
        message: 'GitHub App connection did not complete. Please try connecting again.',
      });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('githubSetup');
      nextParams.delete('installationId');
      nextParams.delete('githubSourceId');
      nextParams.delete('githubFlow');
      nextParams.delete('githubAccessUpdated');
      setSearchParams(nextParams, { replace: true });
    }
  }, [projectId, refreshModal, searchParams, setSearchParams]);

  return {
    pendingGitHubSourceId,
    pendingGitHubFlowType,
    onPendingGitHubSourceHandled,
  };
}
