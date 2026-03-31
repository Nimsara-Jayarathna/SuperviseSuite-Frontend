import { useState } from 'react';
import { supervisorApi } from '../api/supervisorApi';

function isValidGitHubAuthorizeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return host === 'github.com' || host.endsWith('.github.com');
  } catch {
    return false;
  }
}

export type GitHubSetupRedirectState = {
  setupStatus: 'success' | 'failed' | null;
  sourceId: string | null;
  installationId: number | null;
  flowType: 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED' | null;
  githubAccessUpdated: boolean;
};

export function parseGitHubSetupRedirect(searchParams: URLSearchParams): GitHubSetupRedirectState {
  const setupRaw = searchParams.get('githubSetup')?.trim() ?? '';
  const setupStatus = setupRaw === 'success' || setupRaw === 'failed' ? setupRaw : null;

  const sourceIdRaw = searchParams.get('githubSourceId')?.trim() ?? '';
  const sourceId = sourceIdRaw.length > 0 ? sourceIdRaw : null;

  const installationRaw = searchParams.get('installationId')?.trim() ?? '';
  const parsedInstallationId = installationRaw.length > 0 ? Number(installationRaw) : Number.NaN;
  const installationId =
    Number.isFinite(parsedInstallationId) && parsedInstallationId > 0 ? parsedInstallationId : null;

  const flowRaw = searchParams.get('githubFlow')?.trim() ?? '';
  const flowType =
    flowRaw === 'INSTALLATION_DIRECT' || flowRaw === 'INSTALLATION_REQUESTED' ? flowRaw : null;

  return {
    setupStatus,
    sourceId,
    installationId,
    flowType,
    githubAccessUpdated: searchParams.get('githubAccessUpdated') === 'true',
  };
}

export function useGitHubSetupFlow(projectId: string | undefined) {
  const [isStartingOwnerInstall, setIsStartingOwnerInstall] = useState(false);
  const [isStartingRequestedInstall, setIsStartingRequestedInstall] = useState(false);

  async function startOwnerInstall() {
    if (!projectId) {
      throw new Error('Project id is required to start owner install flow.');
    }

    setIsStartingOwnerInstall(true);
    try {
      const response = await supervisorApi.startGitHubAccessSourceInstall({ projectId });
      if (!response.githubAuthorizeUrl?.trim()) {
        throw new Error('GitHub authorize URL is missing.');
      }
      if (!isValidGitHubAuthorizeUrl(response.githubAuthorizeUrl)) {
        throw new Error('GitHub authorize URL is invalid.');
      }
      window.location.assign(response.githubAuthorizeUrl);
    } finally {
      setIsStartingOwnerInstall(false);
    }
  }

  async function startRequestedInstall(requestToken: string) {
    const token = requestToken.trim();
    if (!token) {
      throw new Error('Request token is required to continue access request flow.');
    }

    setIsStartingRequestedInstall(true);
    try {
      const response = await supervisorApi.startGitHubAccessSourceInstall({ requestToken: token });
      if (!response.githubAuthorizeUrl?.trim()) {
        throw new Error('GitHub authorize URL is missing.');
      }
      if (!isValidGitHubAuthorizeUrl(response.githubAuthorizeUrl)) {
        throw new Error('GitHub authorize URL is invalid.');
      }
      window.location.assign(response.githubAuthorizeUrl);
    } finally {
      setIsStartingRequestedInstall(false);
    }
  }

  return {
    isStartingOwnerInstall,
    isStartingRequestedInstall,
    startOwnerInstall,
    startRequestedInstall,
  };
}
