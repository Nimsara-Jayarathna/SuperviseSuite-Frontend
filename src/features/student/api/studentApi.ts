import { apiClient } from '@/services/apiClient';
import type { ProjectGitHubActivity, StudentProjectDetail, StudentProjectSummary } from '../types';

const cachedProjectsById: Partial<Record<string, StudentProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<StudentProjectDetail>>> = {};
const cachedProjectGitHubById: Partial<Record<string, ProjectGitHubActivity>> = {};
const inFlightProjectGitHubRequests: Partial<Record<string, Promise<ProjectGitHubActivity>>> = {};

export const studentApi = {
  getProjects(): Promise<StudentProjectSummary[]> {
    return apiClient.get<StudentProjectSummary[]>('/api/student/projects');
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

    const request = apiClient.get<ProjectGitHubActivity>(`/api/student/projects/${projectId}/github`);
    inFlightProjectGitHubRequests[projectId] = request;

    try {
      const dashboard = await request;
      cachedProjectGitHubById[projectId] = dashboard;
      return dashboard;
    } finally {
      delete inFlightProjectGitHubRequests[projectId];
    }
  },

  async getProjectById(projectId: string, forceRefresh = false): Promise<StudentProjectDetail> {
    if (!forceRefresh && cachedProjectsById[projectId]) {
      return cachedProjectsById[projectId];
    }

    if (!forceRefresh && inFlightProjectRequests[projectId]) {
      return inFlightProjectRequests[projectId];
    }

    const request = apiClient.get<StudentProjectDetail>(`/api/student/projects/${projectId}`);
    inFlightProjectRequests[projectId] = request;

    try {
      const project = await request;
      cachedProjectsById[projectId] = project;
      return project;
    } finally {
      delete inFlightProjectRequests[projectId];
    }
  },
};
