import { apiClient } from '@/services/apiClient';
import {
  buildPagedUrl,
  fallbackSlicePage,
  normalizePaginatedPayload,
  shouldFallbackToDashboard,
} from '@/features/projects/api/githubPagination';
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubRecentCommit,
} from '@/features/projects/types';
import type {
  AddSupervisorProjectMembersRequest,
  AddSupervisorProjectMilestoneRequest,
  GitHubAccessUpdatedAcknowledge,
  GitHubAccessUpdatedSummary,
  GitHubRepositoryAccessRequestContinue,
  GitHubRepositoryAccessRequestCreate,
  GitHubRepositoryAccessRequestValidation,
  GitHubInstallationRepositoriesPage,
  CreateSupervisorProjectRequest,
  CreateSupervisorProjectResponse,
  LinkProjectGitHubRepositoryRequest,
  ProjectGitHubActivity,
  ProjectGitHubRepositoryLink,
  SupervisorDashboard,
  SupervisorProjectDetail,
  SupervisorProjectSummary,
  SupervisorStudentSearchResult,
  UpdateRepositoryRequest,
  UpdateSupervisorProjectMilestoneRequest,
  UpdateSupervisorProjectRequest,
  UpdateSupervisorProjectStatusRequest,
} from '../types';

const cachedProjectsById: Partial<Record<string, SupervisorProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<SupervisorProjectDetail>>> = {};
const cachedProjectGitHubById: Partial<Record<string, ProjectGitHubActivity>> = {};
const inFlightProjectGitHubRequests: Partial<Record<string, Promise<ProjectGitHubActivity>>> = {};

export const supervisorApi = {
  getDashboard(): Promise<SupervisorDashboard> {
    return apiClient.get<SupervisorDashboard>('/api/supervisor/dashboard');
  },

  async getProjectGitHubDashboard(
    projectId: string,
    forceRefresh = false,
  ): Promise<ProjectGitHubActivity> {
    if (!forceRefresh && cachedProjectGitHubById[projectId]) {
      return cachedProjectGitHubById[projectId];
    }

    if (!forceRefresh && inFlightProjectGitHubRequests[projectId]) {
      return inFlightProjectGitHubRequests[projectId];
    }

    const request = apiClient.get<ProjectGitHubActivity>(
      `/api/supervisor/projects/${projectId}/github`,
    );
    inFlightProjectGitHubRequests[projectId] = request;

    try {
      const dashboard = await request;
      cachedProjectGitHubById[projectId] = dashboard;
      return dashboard;
    } finally {
      delete inFlightProjectGitHubRequests[projectId];
    }
  },

  async getProjectGitHubActivityPage(
    projectId: string,
    page: number,
  ): Promise<PaginatedListResult<ProjectGitHubRecentCommit>> {
    try {
      const payload = await apiClient.get<unknown>(
        buildPagedUrl(`/api/supervisor/projects/${projectId}/github/activity`, page),
      );
      return normalizePaginatedPayload<ProjectGitHubRecentCommit>(payload, page);
    } catch (error) {
      if (!shouldFallbackToDashboard(error)) {
        throw error;
      }

      const dashboard = await this.getProjectGitHubDashboard(projectId);
      return fallbackSlicePage<ProjectGitHubRecentCommit>(
        dashboard.recentCommitsPreview ?? [],
        page,
      );
    }
  },

  async getProjectGitHubContributorsPage(
    projectId: string,
    page: number,
  ): Promise<PaginatedListResult<ProjectGitHubContributor>> {
    try {
      const payload = await apiClient.get<unknown>(
        buildPagedUrl(`/api/supervisor/projects/${projectId}/github/contributors`, page),
      );
      return normalizePaginatedPayload<ProjectGitHubContributor>(payload, page);
    } catch (error) {
      if (!shouldFallbackToDashboard(error)) {
        throw error;
      }

      const dashboard = await this.getProjectGitHubDashboard(projectId);
      return fallbackSlicePage<ProjectGitHubContributor>(dashboard.contributorsPreview ?? [], page);
    }
  },

  refreshProjectGitHub(projectId: string): Promise<void> {
    return apiClient.post<void>(`/api/supervisor/projects/${projectId}/github/refresh`, {});
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

  createGitHubRepositoryAccessRequest(projectId: string): Promise<GitHubRepositoryAccessRequestCreate> {
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

  getPublicGitHubAccessUpdatedSummary(
    token: string,
  ): Promise<GitHubAccessUpdatedSummary> {
    const params = new URLSearchParams({ token });
    return apiClient.get<GitHubAccessUpdatedSummary>(
      `/api/github/access-updated/summary?${params.toString()}`,
    );
  },

  acknowledgePublicGitHubAccessUpdated(
    token: string,
  ): Promise<GitHubAccessUpdatedAcknowledge> {
    const params = new URLSearchParams({ token });
    return apiClient.post<GitHubAccessUpdatedAcknowledge>(
      `/api/github/access-updated/acknowledge?${params.toString()}`,
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
    delete cachedProjectGitHubById[projectId];
    return linked;
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
    const body: UpdateRepositoryRequest = { repositoryUrl };
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
