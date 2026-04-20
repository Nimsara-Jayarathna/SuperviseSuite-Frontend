type ApiClient = typeof import('@/services/apiClient').apiClient;
import { appendQuery, clearRecord, deleteKeysWithPrefix } from '@/services/apiCacheUtils';
import {
  buildPagedUrl,
  fallbackSlicePage,
  normalizePaginatedPayload,
  shouldFallbackToDashboard,
} from '@/features/projects/api/githubPagination';
import type {
  PaginatedListResult,
  ProjectGitHubContributor,
  ProjectGitHubPreview,
  ProjectGitHubRecentCommit,
} from '@/features/projects/types';
import type {
  JiraHealth,
  JiraHierarchy,
  JiraSprintProgress,
  JiraWorkload,
} from '@/features/shared/types/jira.types';
import type {
  MeetingChannel,
  MeetingChannelUpsertPayload,
  MeetingRecord,
  MeetingRecordUpsertPayload,
} from '@/features/meetings/types';
import { sortMeetingChannels } from '@/features/meetings/lib/sortMeetingChannels';
import { sortMeetingRecords } from '@/features/meetings/lib/sortMeetingRecords';

type RoleBasePath = '/api/student' | '/api/supervisor';

type ProjectGitHubActivity = ProjectGitHubPreview;

type JiraCache = {
  health?: JiraHealth;
  sprintProgress?: JiraSprintProgress;
  workload?: JiraWorkload;
  hierarchy?: JiraHierarchy;
};

type CreateRoleProjectApiOptions = {
  apiClient: ApiClient;
  roleBasePath: RoleBasePath;
};

export function createRoleProjectApi({ apiClient, roleBasePath }: CreateRoleProjectApiOptions) {
  const cachedProjectGitHubByKey: Partial<Record<string, ProjectGitHubActivity>> = {};
  const inFlightProjectGitHubRequestsByKey: Partial<
    Record<string, Promise<ProjectGitHubActivity>>
  > = {};
  const cachedJiraByProjectId: Partial<Record<string, JiraCache>> = {};
  const cachedMeetingChannelsByProjectId: Partial<Record<string, MeetingChannel[]>> = {};
  const inFlightMeetingChannelsByProjectId: Partial<Record<string, Promise<MeetingChannel[]>>> = {};
  const cachedMeetingRecordsByProjectId: Partial<Record<string, MeetingRecord[]>> = {};
  const inFlightMeetingRecordsByProjectId: Partial<Record<string, Promise<MeetingRecord[]>>> = {};

  function clearCache(): void {
    clearRecord(cachedProjectGitHubByKey);
    clearRecord(inFlightProjectGitHubRequestsByKey);
    clearRecord(cachedJiraByProjectId);
    clearRecord(cachedMeetingChannelsByProjectId);
    clearRecord(inFlightMeetingChannelsByProjectId);
    clearRecord(cachedMeetingRecordsByProjectId);
    clearRecord(inFlightMeetingRecordsByProjectId);
  }

  function invalidateProjectGitHubCaches(projectId: string | null | undefined): void {
    if (!projectId) return;
    deleteKeysWithPrefix(cachedProjectGitHubByKey, `${projectId}:`);
    deleteKeysWithPrefix(inFlightProjectGitHubRequestsByKey, `${projectId}:`);
  }

  function invalidateJiraCache(projectId: string | null | undefined): void {
    if (!projectId) return;
    delete cachedJiraByProjectId[projectId];
  }

  function primeJiraHealth(projectId: string, health: JiraHealth): void {
    cachedJiraByProjectId[projectId] = { ...cachedJiraByProjectId[projectId], health };
  }

  async function getProjectGitHubDashboard(
    projectId: string,
    forceRefresh = false,
    linkedRepositoryId?: string | null,
  ): Promise<ProjectGitHubActivity> {
    const key = `${projectId}:${linkedRepositoryId ?? ''}`;

    if (!forceRefresh && cachedProjectGitHubByKey[key]) {
      return cachedProjectGitHubByKey[key];
    }

    if (!forceRefresh && inFlightProjectGitHubRequestsByKey[key]) {
      return inFlightProjectGitHubRequestsByKey[key] as Promise<ProjectGitHubActivity>;
    }

    const params = new URLSearchParams();
    if (linkedRepositoryId) {
      params.set('linkedRepositoryId', linkedRepositoryId);
    }
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const request = apiClient.get<ProjectGitHubActivity>(
      `${roleBasePath}/projects/${projectId}/github${suffix}`,
    );
    inFlightProjectGitHubRequestsByKey[key] = request;

    try {
      const dashboard = await request;
      cachedProjectGitHubByKey[key] = dashboard;
      return dashboard;
    } finally {
      delete inFlightProjectGitHubRequestsByKey[key];
    }
  }

  async function getProjectGitHubActivityPage(
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
          buildPagedUrl(`${roleBasePath}/projects/${projectId}/github/activity`, page),
          params,
        ),
      );
      return normalizePaginatedPayload<ProjectGitHubRecentCommit>(payload, page);
    } catch (error) {
      if (!shouldFallbackToDashboard(error)) {
        throw error;
      }

      const dashboard = await getProjectGitHubDashboard(projectId, false, linkedRepositoryId);
      return fallbackSlicePage<ProjectGitHubRecentCommit>(
        dashboard.recentCommitsPreview ?? [],
        page,
      );
    }
  }

  async function getProjectGitHubContributorsPage(
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
          buildPagedUrl(`${roleBasePath}/projects/${projectId}/github/contributors`, page),
          params,
        ),
      );
      return normalizePaginatedPayload<ProjectGitHubContributor>(payload, page);
    } catch (error) {
      if (!shouldFallbackToDashboard(error)) {
        throw error;
      }

      const dashboard = await getProjectGitHubDashboard(projectId, false, linkedRepositoryId);
      return fallbackSlicePage<ProjectGitHubContributor>(dashboard.contributorsPreview ?? [], page);
    }
  }

  async function getJiraHealth(projectId: string): Promise<JiraHealth> {
    const hit = cachedJiraByProjectId[projectId]?.health;
    if (hit) return hit;
    const data = await apiClient.get<JiraHealth>(
      `${roleBasePath}/projects/${projectId}/jira/health`,
    );
    cachedJiraByProjectId[projectId] = { ...cachedJiraByProjectId[projectId], health: data };
    return data;
  }

  async function getJiraSprintProgress(projectId: string): Promise<JiraSprintProgress> {
    const hit = cachedJiraByProjectId[projectId]?.sprintProgress;
    if (hit) return hit;
    const data = await apiClient.get<JiraSprintProgress>(
      `${roleBasePath}/projects/${projectId}/jira/sprint-progress`,
    );
    cachedJiraByProjectId[projectId] = {
      ...cachedJiraByProjectId[projectId],
      sprintProgress: data,
    };
    return data;
  }

  async function getJiraWorkload(projectId: string): Promise<JiraWorkload> {
    const hit = cachedJiraByProjectId[projectId]?.workload;
    if (hit) return hit;
    const data = await apiClient.get<JiraWorkload>(
      `${roleBasePath}/projects/${projectId}/jira/workload`,
    );
    cachedJiraByProjectId[projectId] = { ...cachedJiraByProjectId[projectId], workload: data };
    return data;
  }

  async function getProjectJiraHierarchy(projectId: string): Promise<JiraHierarchy> {
    const hit = cachedJiraByProjectId[projectId]?.hierarchy;
    if (hit) return hit;
    const data = await apiClient.get<JiraHierarchy>(
      `${roleBasePath}/projects/${projectId}/jira/hierarchy`,
    );
    cachedJiraByProjectId[projectId] = { ...cachedJiraByProjectId[projectId], hierarchy: data };
    return data;
  }

  async function getProjectMeetingChannels(
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
      `${roleBasePath}/projects/${projectId}/meeting-channels`,
    );
    inFlightMeetingChannelsByProjectId[projectId] = request;

    try {
      const channels = await request;
      cachedMeetingChannelsByProjectId[projectId] = channels;
      return channels;
    } finally {
      delete inFlightMeetingChannelsByProjectId[projectId];
    }
  }

  async function createProjectMeetingChannel(
    projectId: string,
    payload: MeetingChannelUpsertPayload,
  ): Promise<MeetingChannel> {
    const created = await apiClient.post<MeetingChannel>(
      `${roleBasePath}/projects/${projectId}/meeting-channels`,
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
  }

  async function updateProjectMeetingChannel(
    projectId: string,
    channelId: string,
    payload: MeetingChannelUpsertPayload,
  ): Promise<MeetingChannel> {
    const updated = await apiClient.patch<MeetingChannel>(
      `${roleBasePath}/projects/${projectId}/meeting-channels/${channelId}`,
      payload,
    );
    delete inFlightMeetingChannelsByProjectId[projectId];
    const existing = cachedMeetingChannelsByProjectId[projectId];
    if (existing) {
      cachedMeetingChannelsByProjectId[projectId] = sortMeetingChannels(
        existing.map((item) => (item.id === updated.id ? updated : item)),
      );
    }
    return updated;
  }

  async function deleteProjectMeetingChannel(projectId: string, channelId: string): Promise<void> {
    await apiClient.del<void>(
      `${roleBasePath}/projects/${projectId}/meeting-channels/${channelId}`,
    );
    delete inFlightMeetingChannelsByProjectId[projectId];
    const existing = cachedMeetingChannelsByProjectId[projectId];
    if (existing) {
      cachedMeetingChannelsByProjectId[projectId] = existing.filter(
        (item) => item.id !== channelId,
      );
    }
  }

  async function approveProjectMeetingChannel(
    projectId: string,
    channelId: string,
  ): Promise<MeetingChannel> {
    const approved = await apiClient.post<MeetingChannel>(
      `${roleBasePath}/projects/${projectId}/meeting-channels/${channelId}/approve`,
      {},
    );
    delete inFlightMeetingChannelsByProjectId[projectId];
    const existing = cachedMeetingChannelsByProjectId[projectId];
    if (existing) {
      cachedMeetingChannelsByProjectId[projectId] = sortMeetingChannels(
        existing.map((item) => (item.id === approved.id ? approved : item)),
      );
    }
    return approved;
  }

  async function getProjectMeetingRecords(
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
      `${roleBasePath}/projects/${projectId}/meeting-records`,
    );
    inFlightMeetingRecordsByProjectId[projectId] = request;

    try {
      const records = sortMeetingRecords(await request);
      cachedMeetingRecordsByProjectId[projectId] = records;
      return records;
    } finally {
      delete inFlightMeetingRecordsByProjectId[projectId];
    }
  }

  async function createProjectMeetingRecord(
    projectId: string,
    payload: MeetingRecordUpsertPayload,
  ): Promise<MeetingRecord> {
    const created = await apiClient.post<MeetingRecord>(
      `${roleBasePath}/projects/${projectId}/meeting-records`,
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
  }

  async function updateProjectMeetingRecord(
    projectId: string,
    recordId: string,
    payload: MeetingRecordUpsertPayload,
  ): Promise<MeetingRecord> {
    const updated = await apiClient.patch<MeetingRecord>(
      `${roleBasePath}/projects/${projectId}/meeting-records/${recordId}`,
      payload,
    );
    delete inFlightMeetingRecordsByProjectId[projectId];
    const existing = cachedMeetingRecordsByProjectId[projectId];
    if (existing) {
      cachedMeetingRecordsByProjectId[projectId] = sortMeetingRecords(
        existing.map((item) => (item.id === updated.id ? updated : item)),
      );
    }
    return updated;
  }

  async function deleteProjectMeetingRecord(projectId: string, recordId: string): Promise<void> {
    await apiClient.del<void>(`${roleBasePath}/projects/${projectId}/meeting-records/${recordId}`);
    delete inFlightMeetingRecordsByProjectId[projectId];
    const existing = cachedMeetingRecordsByProjectId[projectId];
    if (existing) {
      cachedMeetingRecordsByProjectId[projectId] = existing.filter((item) => item.id !== recordId);
    }
  }

  async function approveProjectMeetingRecord(
    projectId: string,
    recordId: string,
  ): Promise<MeetingRecord> {
    const approved = await apiClient.post<MeetingRecord>(
      `${roleBasePath}/projects/${projectId}/meeting-records/${recordId}/approve`,
      {},
    );
    delete inFlightMeetingRecordsByProjectId[projectId];
    const existing = cachedMeetingRecordsByProjectId[projectId];
    if (existing) {
      cachedMeetingRecordsByProjectId[projectId] = sortMeetingRecords(
        existing.map((item) => (item.id === approved.id ? approved : item)),
      );
    }
    return approved;
  }

  return {
    clearCache,
    invalidateJiraCache,
    invalidateProjectGitHubCaches,
    primeJiraHealth,
    getProjectGitHubDashboard,
    getProjectGitHubActivityPage,
    getProjectGitHubContributorsPage,
    getJiraHealth,
    getJiraSprintProgress,
    getJiraWorkload,
    getProjectJiraHierarchy,
    getProjectMeetingChannels,
    createProjectMeetingChannel,
    updateProjectMeetingChannel,
    deleteProjectMeetingChannel,
    approveProjectMeetingChannel,
    getProjectMeetingRecords,
    createProjectMeetingRecord,
    updateProjectMeetingRecord,
    deleteProjectMeetingRecord,
    approveProjectMeetingRecord,
  };
}
