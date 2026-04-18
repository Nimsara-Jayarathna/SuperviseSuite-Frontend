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
import type {
  MeetingChannel,
  MeetingChannelUpsertPayload,
  MeetingRecord,
  MeetingRecordUpsertPayload,
} from '@/features/meetings/types';
import { sortMeetingChannels } from '@/features/meetings/lib/sortMeetingChannels';
import { sortMeetingRecords } from '@/features/meetings/lib/sortMeetingRecords';

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
const cachedMeetingChannelsByProjectId: Partial<Record<string, MeetingChannel[]>> = {};
const inFlightMeetingChannelsByProjectId: Partial<Record<string, Promise<MeetingChannel[]>>> = {};
const cachedMeetingRecordsByProjectId: Partial<Record<string, MeetingRecord[]>> = {};
const inFlightMeetingRecordsByProjectId: Partial<Record<string, Promise<MeetingRecord[]>>> = {};

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
  clearRecord(cachedMeetingChannelsByProjectId);
  clearRecord(inFlightMeetingChannelsByProjectId);
  clearRecord(cachedMeetingRecordsByProjectId);
  clearRecord(inFlightMeetingRecordsByProjectId);
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

  async getProjectMeetingChannels(
    projectId: string,
    forceRefresh = false,
  ): Promise<MeetingChannel[]> {
    if (!forceRefresh && cachedMeetingChannelsByProjectId[projectId]) {
      return cachedMeetingChannelsByProjectId[projectId] as MeetingChannel[];
    }

    if (!forceRefresh && inFlightMeetingChannelsByProjectId[projectId]) {
      return inFlightMeetingChannelsByProjectId[projectId] as Promise<MeetingChannel[]>;
    }

    if (forceRefresh) {
      delete cachedMeetingChannelsByProjectId[projectId];
    }

    const request = apiClient.get<MeetingChannel[]>(
      `/api/student/projects/${projectId}/meeting-channels`,
    );
    inFlightMeetingChannelsByProjectId[projectId] = request;

    try {
      const channels = await request;
      cachedMeetingChannelsByProjectId[projectId] = channels;
      return channels;
    } finally {
      delete inFlightMeetingChannelsByProjectId[projectId];
    }
  },

  async createProjectMeetingChannel(
    projectId: string,
    payload: MeetingChannelUpsertPayload,
  ): Promise<MeetingChannel> {
    const created = await apiClient.post<MeetingChannel>(
      `/api/student/projects/${projectId}/meeting-channels`,
      payload,
    );
    delete inFlightMeetingChannelsByProjectId[projectId];
    const existing = cachedMeetingChannelsByProjectId[projectId];
    if (existing) {
      cachedMeetingChannelsByProjectId[projectId] = sortMeetingChannels([
        created,
        ...existing.filter((item) => item.id !== created.id),
      ]);
    }
    return created;
  },

  async getProjectMeetingRecords(
    projectId: string,
    forceRefresh = false,
  ): Promise<MeetingRecord[]> {
    if (!forceRefresh && cachedMeetingRecordsByProjectId[projectId]) {
      return cachedMeetingRecordsByProjectId[projectId] as MeetingRecord[];
    }

    if (!forceRefresh && inFlightMeetingRecordsByProjectId[projectId]) {
      return inFlightMeetingRecordsByProjectId[projectId] as Promise<MeetingRecord[]>;
    }

    if (forceRefresh) {
      delete cachedMeetingRecordsByProjectId[projectId];
    }

    const request = apiClient.get<MeetingRecord[]>(
      `/api/student/projects/${projectId}/meeting-records`,
    );
    inFlightMeetingRecordsByProjectId[projectId] = request;

    try {
      const records = sortMeetingRecords(await request);
      cachedMeetingRecordsByProjectId[projectId] = records;
      return records;
    } finally {
      delete inFlightMeetingRecordsByProjectId[projectId];
    }
  },

  async createProjectMeetingRecord(
    projectId: string,
    payload: MeetingRecordUpsertPayload,
  ): Promise<MeetingRecord> {
    const created = await apiClient.post<MeetingRecord>(
      `/api/student/projects/${projectId}/meeting-records`,
      payload,
    );
    delete inFlightMeetingRecordsByProjectId[projectId];
    const existing = cachedMeetingRecordsByProjectId[projectId];
    if (existing) {
      cachedMeetingRecordsByProjectId[projectId] = sortMeetingRecords([
        created,
        ...existing.filter((item) => item.id !== created.id),
      ]);
    }
    return created;
  },
};
