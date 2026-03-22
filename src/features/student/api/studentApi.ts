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
import type { ProjectGitHubActivity, StudentProjectDetail, StudentProjectSummary } from '../types';

const cachedProjectsById: Partial<Record<string, StudentProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<StudentProjectDetail>>> = {};
const cachedProjectGitHubById: Partial<Record<string, ProjectGitHubActivity>> = {};
const inFlightProjectGitHubRequests: Partial<Record<string, Promise<ProjectGitHubActivity>>> = {};

function clearRecord(record: Partial<Record<string, unknown>>) {
  for (const key of Object.keys(record)) {
    delete record[key];
  }
}

function clearStudentApiCache() {
  clearRecord(cachedProjectsById);
  clearRecord(inFlightProjectRequests);
  clearRecord(cachedProjectGitHubById);
  clearRecord(inFlightProjectGitHubRequests);
}

registerSessionCacheClearer(clearStudentApiCache);

export const studentApi = {
  clearCache(): void {
    clearStudentApiCache();
  },

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

    const request = apiClient.get<ProjectGitHubActivity>(
      `/api/student/projects/${projectId}/github`,
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
        buildPagedUrl(`/api/student/projects/${projectId}/github/activity`, page),
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
        buildPagedUrl(`/api/student/projects/${projectId}/github/contributors`, page),
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
