import { apiClient } from '@/services/apiClient';
import { registerSessionCacheClearer } from '@/services/sessionCache';
import { createRoleProjectApi } from '@/features/shared/api/createRoleProjectApi';
import { clearRecord } from '@/services/apiCacheUtils';
import type { StudentProjectDetail } from '../types';
import { createStudentMeApi } from './studentMeApi';
import { createStudentProjectsApi } from './studentProjectsApi';

const cachedProjectsById: Partial<Record<string, StudentProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<StudentProjectDetail>>> = {};
const { clearCache: clearRoleProjectCache, ...roleProjectApi } = createRoleProjectApi({
  apiClient,
  roleBasePath: '/api/student',
});
const studentMeApi = createStudentMeApi({ apiClient });
const studentProjectsApi = createStudentProjectsApi({
  apiClient,
  cachedProjectsById,
  inFlightProjectRequests,
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
  ...studentMeApi,
  ...studentProjectsApi,
};
