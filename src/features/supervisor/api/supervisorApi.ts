import { apiClient } from '@/services/apiClient';
import type {
  AddSupervisorProjectMembersRequest,
  AddSupervisorProjectMilestoneRequest,
  CreateSupervisorProjectRequest,
  CreateSupervisorProjectResponse,
  SupervisorDashboard,
  SupervisorProjectDetail,
  SupervisorProjectSummary,
  SupervisorStudentSearchResult,
  UpdateRepositoryRequest,
  UpdateSupervisorProjectMilestoneRequest,
  UpdateSupervisorProjectRequest,
  UpdateSupervisorProjectStatusRequest,
  ProjectCommitActivity,
} from '../types';

const cachedProjectsById: Partial<Record<string, SupervisorProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<SupervisorProjectDetail>>> = {};
const cachedProjectCommitsById: Partial<Record<string, ProjectCommitActivity>> = {};
const inFlightProjectCommitRequests: Partial<Record<string, Promise<ProjectCommitActivity>>> = {};

export const supervisorApi = {
  getDashboard(): Promise<SupervisorDashboard> {
    return apiClient.get<SupervisorDashboard>('/api/supervisor/dashboard');
  },

  async getProjectCommits(
    projectId: string,
    forceRefresh = false,
  ): Promise<ProjectCommitActivity> {
    if (!forceRefresh && cachedProjectCommitsById[projectId]) {
      return cachedProjectCommitsById[projectId];
    }

    if (!forceRefresh && inFlightProjectCommitRequests[projectId]) {
      return inFlightProjectCommitRequests[projectId];
    }

    const request = apiClient.get<ProjectCommitActivity>(`/api/supervisor/projects/${projectId}/commits`);
    inFlightProjectCommitRequests[projectId] = request;

    try {
      const activity = await request;
      cachedProjectCommitsById[projectId] = activity;
      return activity;
    } finally {
      delete inFlightProjectCommitRequests[projectId];
    }
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
