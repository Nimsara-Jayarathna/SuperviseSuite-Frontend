import { apiClient } from '@/services/apiClient';
import {
  buildPagedUrl,
  fallbackSlicePage,
  normalizePaginatedPayload,
  shouldFallbackToDashboard,
} from '@/features/projects/api/githubPagination';
import { registerSessionCacheClearer } from '@/services/sessionCache';
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubRecentCommit,
} from '@/features/projects/types';
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
  ProjectGitHubActivity,
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
const cachedProjectGitHubByKey: Partial<Record<string, ProjectGitHubActivity>> = {};
const inFlightProjectGitHubRequestsByKey: Partial<Record<string, Promise<ProjectGitHubActivity>>> =
  {};

function clearRecord(record: Partial<Record<string, unknown>>) {
  for (const key of Object.keys(record)) {
    delete record[key];
  }
}

function clearSupervisorApiCache() {
  clearRecord(cachedProjectsById);
  clearRecord(inFlightProjectRequests);
  clearRecord(cachedProjectGitHubByKey);
  clearRecord(inFlightProjectGitHubRequestsByKey);
}

function invalidateProjectCaches(projectId: string | null | undefined) {
  if (!projectId) {
    return;
  }
  delete cachedProjectsById[projectId];
  delete inFlightProjectRequests[projectId];
  for (const key of Object.keys(cachedProjectGitHubByKey)) {
    if (key.startsWith(`${projectId}:`)) {
      delete cachedProjectGitHubByKey[key];
    }
  }
  for (const key of Object.keys(inFlightProjectGitHubRequestsByKey)) {
    if (key.startsWith(`${projectId}:`)) {
      delete inFlightProjectGitHubRequestsByKey[key];
    }
  }
}

function appendQuery(url: string, params: URLSearchParams): string {
  const query = params.toString();
  if (!query) {
    return url;
  }
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

registerSessionCacheClearer(clearSupervisorApiCache);

export const supervisorApi = {
  clearCache(): void {
    clearSupervisorApiCache();
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

  getJiraHealth(projectId: string): Promise<JiraHealth> {
    return apiClient.get<JiraHealth>(`/api/supervisor/projects/${projectId}/jira/health`);
  },

  refreshProjectJira(projectId: string): Promise<JiraHealth> {
    return apiClient.post<JiraHealth>(`/api/supervisor/projects/${projectId}/jira/refresh`, {});
  },

  async getProjectGitHubDashboard(
    projectId: string,
    forceRefresh = false,
    linkedRepositoryId?: string | null,
  ): Promise<ProjectGitHubActivity> {
    const key = `${projectId}:${linkedRepositoryId ?? ''}`;

    if (!forceRefresh && cachedProjectGitHubByKey[key]) {
      return cachedProjectGitHubByKey[key];
    }

    if (!forceRefresh && inFlightProjectGitHubRequestsByKey[key]) {
      return inFlightProjectGitHubRequestsByKey[key];
    }

    const params = new URLSearchParams();
    if (linkedRepositoryId) {
      params.set('linkedRepositoryId', linkedRepositoryId);
    }
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const request = apiClient.get<ProjectGitHubActivity>(
      `/api/supervisor/projects/${projectId}/github${suffix}`,
    );
    inFlightProjectGitHubRequestsByKey[key] = request;

    try {
      const dashboard = await request;
      cachedProjectGitHubByKey[key] = dashboard;
      return dashboard;
    } finally {
      delete inFlightProjectGitHubRequestsByKey[key];
    }
  },

  async getProjectGitHubActivityPage(
    projectId: string,
    page: number,
    linkedRepositoryId?: string | null,
  ): Promise<PaginatedListResult<ProjectGitHubRecentCommit>> {
    const params = new URLSearchParams();
    if (linkedRepositoryId) {
      params.set('linkedRepositoryId', linkedRepositoryId);
    }
    try {
      const payload = await apiClient.get<unknown>(
        appendQuery(
          buildPagedUrl(`/api/supervisor/projects/${projectId}/github/activity`, page),
          params,
        ),
      );
      return normalizePaginatedPayload<ProjectGitHubRecentCommit>(payload, page);
    } catch (error) {
      if (!shouldFallbackToDashboard(error)) {
        throw error;
      }

      const dashboard = await this.getProjectGitHubDashboard(projectId, false, linkedRepositoryId);
      return fallbackSlicePage<ProjectGitHubRecentCommit>(
        dashboard.recentCommitsPreview ?? [],
        page,
      );
    }
  },

  async getProjectGitHubContributorsPage(
    projectId: string,
    page: number,
    linkedRepositoryId?: string | null,
  ): Promise<PaginatedListResult<ProjectGitHubContributor>> {
    const params = new URLSearchParams();
    if (linkedRepositoryId) {
      params.set('linkedRepositoryId', linkedRepositoryId);
    }
    try {
      const payload = await apiClient.get<unknown>(
        appendQuery(
          buildPagedUrl(`/api/supervisor/projects/${projectId}/github/contributors`, page),
          params,
        ),
      );
      return normalizePaginatedPayload<ProjectGitHubContributor>(payload, page);
    } catch (error) {
      if (!shouldFallbackToDashboard(error)) {
        throw error;
      }

      const dashboard = await this.getProjectGitHubDashboard(projectId, false, linkedRepositoryId);
      return fallbackSlicePage<ProjectGitHubContributor>(dashboard.contributorsPreview ?? [], page);
    }
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
    for (const key of Object.keys(cachedProjectGitHubByKey)) {
      if (key.startsWith(`${projectId}:`)) {
        delete cachedProjectGitHubByKey[key];
      }
    }
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
    for (const key of Object.keys(cachedProjectGitHubByKey)) {
      if (key.startsWith(`${projectId}:`)) {
        delete cachedProjectGitHubByKey[key];
      }
    }
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
