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
import type {
  JiraHealth,
  JiraHierarchy,
  JiraSprintProgress,
  JiraWorkload,
} from '@/features/supervisor/types';
import type { MeetingChannel, MeetingChannelUpsertPayload } from '@/features/meetings/types';

const cachedProjectsById: Partial<Record<string, StudentProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<StudentProjectDetail>>> = {};
const cachedProjectGitHubByKey: Partial<Record<string, ProjectGitHubActivity>> = {};
const inFlightProjectGitHubRequestsByKey: Partial<Record<string, Promise<ProjectGitHubActivity>>> =
  {};
type JiraCache = {
  health?: JiraHealth;
  sprintProgress?: JiraSprintProgress;
  workload?: JiraWorkload;
  hierarchy?: JiraHierarchy;
};
const cachedJiraByProjectId: Partial<Record<string, JiraCache>> = {};

function clearRecord(record: Partial<Record<string, unknown>>) {
  for (const key of Object.keys(record)) {
    delete record[key];
  }
}

function clearStudentApiCache() {
  clearRecord(cachedProjectsById);
  clearRecord(inFlightProjectRequests);
  clearRecord(cachedProjectGitHubByKey);
  clearRecord(inFlightProjectGitHubRequestsByKey);
  clearRecord(cachedJiraByProjectId);
}

function appendQuery(url: string, params: URLSearchParams): string {
  const query = params.toString();
  if (!query) {
    return url;
  }
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

registerSessionCacheClearer(clearStudentApiCache);

export const studentApi = {
  clearCache(): void {
    clearStudentApiCache();
  },

  changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    return apiClient.patch<void>('/api/student/me/password', payload);
  },

  getProjects(): Promise<StudentProjectSummary[]> {
    return apiClient.get<StudentProjectSummary[]>('/api/student/projects');
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
      `/api/student/projects/${projectId}/github${suffix}`,
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
          buildPagedUrl(`/api/student/projects/${projectId}/github/activity`, page),
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
          buildPagedUrl(`/api/student/projects/${projectId}/github/contributors`, page),
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

  async getJiraHealth(projectId: string): Promise<JiraHealth> {
    const hit = cachedJiraByProjectId[projectId]?.health;
    if (hit) return hit;
    const data = await apiClient.get<JiraHealth>(`/api/student/projects/${projectId}/jira/health`);
    cachedJiraByProjectId[projectId] = { ...cachedJiraByProjectId[projectId], health: data };
    return data;
  },

  async getJiraSprintProgress(projectId: string): Promise<JiraSprintProgress> {
    const hit = cachedJiraByProjectId[projectId]?.sprintProgress;
    if (hit) return hit;
    const data = await apiClient.get<JiraSprintProgress>(
      `/api/student/projects/${projectId}/jira/sprint-progress`,
    );
    cachedJiraByProjectId[projectId] = {
      ...cachedJiraByProjectId[projectId],
      sprintProgress: data,
    };
    return data;
  },

  async getJiraWorkload(projectId: string): Promise<JiraWorkload> {
    const hit = cachedJiraByProjectId[projectId]?.workload;
    if (hit) return hit;
    const data = await apiClient.get<JiraWorkload>(
      `/api/student/projects/${projectId}/jira/workload`,
    );
    cachedJiraByProjectId[projectId] = { ...cachedJiraByProjectId[projectId], workload: data };
    return data;
  },

  async getProjectJiraHierarchy(projectId: string): Promise<JiraHierarchy> {
    const hit = cachedJiraByProjectId[projectId]?.hierarchy;
    if (hit) return hit;
    const data = await apiClient.get<JiraHierarchy>(
      `/api/student/projects/${projectId}/jira/hierarchy`,
    );
    cachedJiraByProjectId[projectId] = { ...cachedJiraByProjectId[projectId], hierarchy: data };
    return data;
  },

  getProjectMeetingChannels(projectId: string): Promise<MeetingChannel[]> {
    return apiClient.get<MeetingChannel[]>(`/api/student/projects/${projectId}/meeting-channels`);
  },

  createProjectMeetingChannel(
    projectId: string,
    payload: MeetingChannelUpsertPayload,
  ): Promise<MeetingChannel> {
    return apiClient.post<MeetingChannel>(`/api/student/projects/${projectId}/meeting-channels`, payload);
  },
};
