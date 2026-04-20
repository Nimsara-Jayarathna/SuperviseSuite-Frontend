import { apiClient } from '@/services/apiClient';
import { registerSessionCacheClearer } from '@/services/sessionCache';
import { createRoleProjectApi } from '@/features/shared/api/createRoleProjectApi';
import { clearRecord } from '@/services/apiCacheUtils';
import type { StudentProjectDetail, StudentProjectSummary } from '../types';

const cachedProjectsById: Partial<Record<string, StudentProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<StudentProjectDetail>>> = {};
const { clearCache: clearRoleProjectCache, ...roleProjectApi } = createRoleProjectApi({
  roleBasePath: '/api/student',
});

function clearStudentApiCache() {
  clearRecord(cachedProjectsById);
  clearRecord(inFlightProjectRequests);
  clearRoleProjectCache();
}

registerSessionCacheClearer(clearStudentApiCache);

export const studentApi = {
  clearCache(): void {
    clearStudentApiCache();
  },

  ...roleProjectApi,

  changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    return apiClient.patch<void>('/api/student/me/password', payload);
  },

  getProjects(): Promise<StudentProjectSummary[]> {
    return apiClient.get<StudentProjectSummary[]>('/api/student/projects');
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
