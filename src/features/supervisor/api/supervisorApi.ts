import { apiClient } from '@/services/apiClient';
import { registerSessionCacheClearer } from '@/services/sessionCache';
import { createRoleProjectApi } from '@/features/shared/api/createRoleProjectApi';
import { clearRecord } from '@/services/apiCacheUtils';
import type {
  AddSupervisorProjectMembersRequest,
  AddSupervisorProjectMilestoneRequest,
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
  CreateSupervisorProjectRequest,
  CreateSupervisorProjectResponse,
  LinkProjectGitHubRepositoryRequest,
  ProjectGitHubRepositoryLink,
  JiraAuthUrl,
  JiraHealth,
  JiraOAuthCompletePayload,
  JiraOAuthCompleteResult,
  SupervisorDashboard,
  SupervisorProjectDetail,
  SupervisorProjectSummary,
  SupervisorStudentSearchResult,
  UpdateRepositoryRequest,
  UpdateSupervisorProjectMilestoneRequest,
  UpdateSupervisorProjectRequest,
  UpdateSupervisorProjectStatusRequest,
} from '../types';
import { normalizeGitHubRepositoryUrl } from '../utils/githubRepositoryUrl';

const cachedProjectsById: Partial<Record<string, SupervisorProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<SupervisorProjectDetail>>> = {};
const { clearCache: clearRoleProjectCache, ...roleProjectApi } = createRoleProjectApi({
  roleBasePath: '/api/supervisor',
});

function clearSupervisorApiCache() {
  clearRecord(cachedProjectsById);
  clearRecord(inFlightProjectRequests);
  clearRoleProjectCache();
}

function invalidateProjectCaches(projectId: string | null | undefined) {
  if (!projectId) {
    return;
  }
  delete cachedProjectsById[projectId];
  delete inFlightProjectRequests[projectId];
  roleProjectApi.invalidateProjectGitHubCaches(projectId);
}

registerSessionCacheClearer(clearSupervisorApiCache);

export const supervisorApi = {
  ...roleProjectApi,

  clearCache(): void {
    clearSupervisorApiCache();
  },

  changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    return apiClient.patch<void>('/api/supervisor/me/password', payload);
  },

  getDashboard(): Promise<SupervisorDashboard> {
    return apiClient.get<SupervisorDashboard>('/api/supervisor/dashboard');
  },

  getProjectJiraAuthUrl(projectId: string): Promise<JiraAuthUrl> {
    return apiClient.get<JiraAuthUrl>(`/api/supervisor/projects/${projectId}/jira/auth-url`);
  },

  completeJiraOAuth(payload: JiraOAuthCompletePayload): Promise<JiraOAuthCompleteResult> {
    return apiClient.post<JiraOAuthCompleteResult>('/api/supervisor/jira/oauth/complete', payload);
  },

  disconnectProjectJira(projectId: string): Promise<SupervisorProjectDetail> {
    return apiClient.post<SupervisorProjectDetail>(
      `/api/supervisor/projects/${projectId}/jira/disconnect`,
      {},
    );
  },

  async refreshProjectJira(projectId: string): Promise<JiraHealth> {
    const fresh = await apiClient.post<JiraHealth>(
      `/api/supervisor/projects/${projectId}/jira/refresh`,
      {},
    );
    roleProjectApi.invalidateJiraCache(projectId);
    roleProjectApi.primeJiraHealth(projectId, fresh);
    return fresh;
  },

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

  async getProjectRepositoriesInventory(
    projectId: string,
  ): Promise<ProjectGitHubRepositoryListing> {
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

  getProjects(): Promise<SupervisorProjectSummary[]> {
    return apiClient.get<SupervisorProjectSummary[]>('/api/supervisor/projects');
  },

  async getProjectById(projectId: string, forceRefresh = false): Promise<SupervisorProjectDetail> {
    if (!forceRefresh && cachedProjectsById[projectId]) {
      return cachedProjectsById[projectId];
    }

    if (!forceRefresh && inFlightProjectRequests[projectId]) {
      return inFlightProjectRequests[projectId];
    }

    const request = apiClient.get<SupervisorProjectDetail>(`/api/supervisor/projects/${projectId}`);
    inFlightProjectRequests[projectId] = request;

    try {
      const project = await request;
      cachedProjectsById[projectId] = project;
      return project;
    } finally {
      delete inFlightProjectRequests[projectId];
    }
  },

  searchStudents(query: string): Promise<SupervisorStudentSearchResult[]> {
    const params = new URLSearchParams({ q: query });
    return apiClient.get<SupervisorStudentSearchResult[]>(
      `/api/supervisor/students/search?${params.toString()}`,
    );
  },

  createProject(body: CreateSupervisorProjectRequest): Promise<CreateSupervisorProjectResponse> {
    return apiClient.post<CreateSupervisorProjectResponse>('/api/supervisor/projects', body);
  },

  async updateProject(
    projectId: string,
    body: UpdateSupervisorProjectRequest,
  ): Promise<SupervisorProjectDetail> {
    const updated = await apiClient.patch<SupervisorProjectDetail>(
      `/api/supervisor/projects/${projectId}`,
      body,
    );
    cachedProjectsById[projectId] = updated;
    return updated;
  },

  async updateProjectStatus(
    projectId: string,
    body: UpdateSupervisorProjectStatusRequest,
  ): Promise<SupervisorProjectDetail> {
    const updated = await apiClient.patch<SupervisorProjectDetail>(
      `/api/supervisor/projects/${projectId}/status`,
      body,
    );
    cachedProjectsById[projectId] = updated;
    return updated;
  },

  async updateRepository(
    projectId: string,
    repositoryUrl: string | null,
  ): Promise<SupervisorProjectDetail> {
    const normalizedRepositoryUrl =
      typeof repositoryUrl === 'string' ? normalizeGitHubRepositoryUrl(repositoryUrl) : null;
    const body: UpdateRepositoryRequest = { repositoryUrl: normalizedRepositoryUrl };
    const updated = await apiClient.patch<SupervisorProjectDetail>(
      `/api/supervisor/projects/${projectId}/repository`,
      body,
    );
    cachedProjectsById[projectId] = updated;
    return updated;
  },

  async addProjectMembers(
    projectId: string,
    body: AddSupervisorProjectMembersRequest,
  ): Promise<SupervisorProjectDetail> {
    const updated = await apiClient.post<SupervisorProjectDetail>(
      `/api/supervisor/projects/${projectId}/members`,
      body,
    );
    cachedProjectsById[projectId] = updated;
    return updated;
  },

  async addProjectMilestone(
    projectId: string,
    body: AddSupervisorProjectMilestoneRequest,
  ): Promise<SupervisorProjectDetail> {
    const updated = await apiClient.post<SupervisorProjectDetail>(
      `/api/supervisor/projects/${projectId}/milestones`,
      body,
    );
    cachedProjectsById[projectId] = updated;
    return updated;
  },

  async updateProjectMilestone(
    projectId: string,
    milestoneId: string,
    body: UpdateSupervisorProjectMilestoneRequest,
  ): Promise<SupervisorProjectDetail> {
    const updated = await apiClient.patch<SupervisorProjectDetail>(
      `/api/supervisor/projects/${projectId}/milestones/${milestoneId}`,
      body,
    );
    cachedProjectsById[projectId] = updated;
    return updated;
  },
};
