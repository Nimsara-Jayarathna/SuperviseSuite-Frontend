import type { createRoleProjectApi } from '@/features/shared/api/createRoleProjectApi';
import type {
  GitHubAccessRequestCreateV2,
  GitHubAvailableRepositories,
  GitHubInstallStart,
  GitHubAccessUpdatedAcknowledge,
  GitHubAccessUpdatedSummary,
  LinkGitHubRepositoriesPayload,
  GitHubRepositoryAccessRequestContinue,
  GitHubRepositoryAccessRequestCreate,
  GitHubRepositoryAccessRequestValidation,
  GitHubInstallationRepositoriesPage,
  ProjectGitHubRepositories,
  ProjectGitHubRepositoryListing,
  LinkProjectGitHubRepositoryRequest,
  ProjectGitHubRepositoryLink,
  SupervisorProjectDetail,
} from '../types';
import { normalizeGitHubRepositoryUrl } from '../utils/githubRepositoryUrl';

type RoleProjectApi = Omit<ReturnType<typeof createRoleProjectApi>, 'clearCache'>;
type ApiClient = typeof import('@/services/apiClient').apiClient;

type SupervisorProjectCache = Partial<Record<string, SupervisorProjectDetail>>;

type CreateSupervisorGitHubApiDeps = {
  apiClient: ApiClient;
  roleProjectApi: RoleProjectApi;
  cachedProjectsById: SupervisorProjectCache;
  invalidateProjectCaches: (projectId: string | null | undefined) => void;
};

export function createSupervisorGitHubApi({
  apiClient,
  roleProjectApi,
  cachedProjectsById,
  invalidateProjectCaches,
}: CreateSupervisorGitHubApiDeps) {
  return {
    refreshProjectGitHub(projectId: string): Promise<void> {
      return apiClient.post<void>(`/api/supervisor/projects/${projectId}/github/refresh`, {});
    },

    startGitHubAccessSourceInstall(body: {
      projectId?: string;
      requestToken?: string;
    }): Promise<GitHubInstallStart> {
      return apiClient.post<GitHubInstallStart>('/api/github/access-source/install/start', body);
    },

    createPublicGitHubAccessSource(
      projectId: string,
      repositoryUrl: string,
    ): Promise<GitHubAvailableRepositories> {
      const normalizedRepositoryUrl = normalizeGitHubRepositoryUrl(repositoryUrl);
      if (!normalizedRepositoryUrl) {
        throw new Error('Invalid GitHub repository URL.');
      }
      return apiClient.post<GitHubAvailableRepositories>('/api/github/access-source/public', {
        projectId,
        repositoryUrl: normalizedRepositoryUrl,
      });
    },

    createGitHubAccessSourceRequest(projectId: string): Promise<GitHubAccessRequestCreateV2> {
      return apiClient.post<GitHubAccessRequestCreateV2>('/api/github/access-source/request', {
        projectId,
      });
    },

    getAvailableGitHubRepositories(sourceId: string): Promise<GitHubAvailableRepositories> {
      const params = new URLSearchParams({ sourceId });
      return apiClient.get<GitHubAvailableRepositories>(
        `/api/github/repositories/available?${params.toString()}`,
      );
    },

    async linkGitHubRepositories(
      payload: LinkGitHubRepositoriesPayload,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        '/api/github/repositories/link',
        payload,
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    getProjectGitHubRepositories(projectId: string): Promise<ProjectGitHubRepositories> {
      return apiClient.get<ProjectGitHubRepositories>(
        `/api/projects/${projectId}/github-repositories`,
      );
    },

    async unlinkGitHubRepository(linkedRepositoryId: string): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.del<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}`,
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async enableGitHubRepository(linkedRepositoryId: string): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/enable`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async disableGitHubRepository(linkedRepositoryId: string): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/disable`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async disconnectGitHubAccessSource(sourceId: string): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.del<ProjectGitHubRepositories>(
        `/api/github/access-source/${sourceId}`,
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async refreshGitHubRepository(linkedRepositoryId: string): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/refresh`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async selectPrimaryGitHubRepository(
      linkedRepositoryId: string,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/select`,
        {},
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    async updateGitHubRepositoryDisplayName(
      linkedRepositoryId: string,
      customName: string | null,
    ): Promise<ProjectGitHubRepositories> {
      const data = await apiClient.post<ProjectGitHubRepositories>(
        `/api/github/repositories/${linkedRepositoryId}/display-name`,
        { customName },
      );
      invalidateProjectCaches(data.projectId);
      return data;
    },

    getInstallationRepositories(
      projectId: string,
      installationId: number,
      page = 1,
      size?: number,
    ): Promise<GitHubInstallationRepositoriesPage> {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
        params.set('size', String(Math.floor(size)));
      }

      return apiClient.get<GitHubInstallationRepositoriesPage>(
        `/api/supervisor/projects/${projectId}/github/installations/${installationId}/repositories?${params.toString()}`,
      );
    },

    getProjectRepositoriesInventory(projectId: string): Promise<ProjectGitHubRepositoryListing> {
      return apiClient.get<ProjectGitHubRepositoryListing>(
        `/api/supervisor/projects/${projectId}/github/repositories/inventory`,
      );
    },

    createGitHubRepositoryAccessRequest(
      projectId: string,
    ): Promise<GitHubRepositoryAccessRequestCreate> {
      return apiClient.post<GitHubRepositoryAccessRequestCreate>(
        `/api/supervisor/projects/${projectId}/github/access-requests`,
        {},
      );
    },

    validateGitHubRepositoryAccessRequest(
      projectId: string,
      token: string,
    ): Promise<GitHubRepositoryAccessRequestValidation> {
      const params = new URLSearchParams({ token });
      return apiClient.get<GitHubRepositoryAccessRequestValidation>(
        `/api/supervisor/projects/${projectId}/github/access-requests/validate?${params.toString()}`,
      );
    },

    validatePublicGitHubRepositoryAccessRequest(
      token: string,
    ): Promise<GitHubRepositoryAccessRequestValidation> {
      const params = new URLSearchParams({ token });
      return apiClient.get<GitHubRepositoryAccessRequestValidation>(
        `/api/github/access-requests/validate?${params.toString()}`,
      );
    },

    continueGitHubRepositoryAccessRequest(
      projectId: string,
      token: string,
    ): Promise<GitHubRepositoryAccessRequestContinue> {
      const params = new URLSearchParams({ token });
      return apiClient.post<GitHubRepositoryAccessRequestContinue>(
        `/api/supervisor/projects/${projectId}/github/access-requests/continue?${params.toString()}`,
        {},
      );
    },

    continuePublicGitHubRepositoryAccessRequest(
      token: string,
    ): Promise<GitHubRepositoryAccessRequestContinue> {
      const params = new URLSearchParams({ token });
      return apiClient.post<GitHubRepositoryAccessRequestContinue>(
        `/api/github/access-requests/continue?${params.toString()}`,
        {},
      );
    },

    getPublicGitHubAccessUpdatedSummary(token: string): Promise<GitHubAccessUpdatedSummary> {
      const params = new URLSearchParams({ token });
      return apiClient.get<GitHubAccessUpdatedSummary>(
        `/api/github/access-updated/summary?${params.toString()}`,
      );
    },

    acknowledgePublicGitHubAccessUpdated(token: string): Promise<GitHubAccessUpdatedAcknowledge> {
      const params = new URLSearchParams({ token });
      return apiClient.post<GitHubAccessUpdatedAcknowledge>(
        `/api/github/access-updated/acknowledge?${params.toString()}`,
        {},
      );
    },

    getProjectGitHubAccessUpdatedSummary(projectId: string): Promise<GitHubAccessUpdatedSummary> {
      return apiClient.get<GitHubAccessUpdatedSummary>(
        `/api/supervisor/projects/${projectId}/access-updated/summary`,
      );
    },

    acknowledgeProjectGitHubAccessUpdated(
      projectId: string,
    ): Promise<GitHubAccessUpdatedAcknowledge> {
      return apiClient.post<GitHubAccessUpdatedAcknowledge>(
        `/api/supervisor/projects/${projectId}/access-updated/acknowledge`,
        {},
      );
    },

    async linkProjectGitHubRepository(
      projectId: string,
      body: LinkProjectGitHubRepositoryRequest,
    ): Promise<ProjectGitHubRepositoryLink> {
      const linked = await apiClient.post<ProjectGitHubRepositoryLink>(
        `/api/supervisor/projects/${projectId}/github/link`,
        body,
      );
      delete cachedProjectsById[projectId];
      roleProjectApi.invalidateProjectGitHubCaches(projectId);
      return linked;
    },

    async removeProjectGitHubAccessAuthorization(
      projectId: string,
    ): Promise<SupervisorProjectDetail> {
      const updated = await apiClient.post<SupervisorProjectDetail>(
        `/api/supervisor/projects/${projectId}/github/access/remove`,
        {},
      );
      cachedProjectsById[projectId] = updated;
      roleProjectApi.invalidateProjectGitHubCaches(projectId);
      return updated;
    },
  };
}
