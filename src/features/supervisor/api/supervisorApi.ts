import { apiClient } from '@/services/apiClient';
import { registerSessionCacheClearer } from '@/services/sessionCache';
import { createRoleProjectApi } from '@/features/shared/api/createRoleProjectApi';
import { clearRecord } from '@/services/apiCacheUtils';
import type { SupervisorProjectDetail } from '../types';
import { createSupervisorDashboardApi } from './supervisorDashboardApi';
import { createSupervisorGitHubApi } from './supervisorGitHubApi';
import { createSupervisorJiraApi } from './supervisorJiraApi';
import { createSupervisorMeApi } from './supervisorMeApi';
import { createSupervisorProjectsApi } from './supervisorProjectsApi';
import { createSupervisorStudentsApi } from './supervisorStudentsApi';

const cachedProjectsById: Partial<Record<string, SupervisorProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<SupervisorProjectDetail>>> = {};
const { clearCache: clearRoleProjectCache, ...roleProjectApi } = createRoleProjectApi({
  apiClient,
  roleBasePath: '/api/supervisor',
});
const supervisorMeApi = createSupervisorMeApi({ apiClient });
const supervisorDashboardApi = createSupervisorDashboardApi({ apiClient });
const supervisorStudentsApi = createSupervisorStudentsApi({ apiClient });
const supervisorJiraApi = createSupervisorJiraApi({ apiClient, roleProjectApi });
const supervisorProjectsApi = createSupervisorProjectsApi({
  apiClient,
  cachedProjectsById,
  inFlightProjectRequests,
});

function clearSupervisorApiCache() {
  clearRecord(cachedProjectsById);
  clearRecord(inFlightProjectRequests);
  clearRoleProjectCache();
}

function invalidateProjectCaches(projectId: string | null | undefined) {
  if (!projectId) {
    return;
  }
  delete cachedProjectsById[projectId];
  delete inFlightProjectRequests[projectId];
  roleProjectApi.invalidateProjectGitHubCaches(projectId);
}

registerSessionCacheClearer(clearSupervisorApiCache);

export const supervisorApi = {
  ...roleProjectApi,
  ...supervisorMeApi,
  ...supervisorDashboardApi,
  ...supervisorStudentsApi,
  ...supervisorJiraApi,
  ...createSupervisorGitHubApi({
    apiClient,
    roleProjectApi,
    cachedProjectsById,
    invalidateProjectCaches,
  }),
  ...supervisorProjectsApi,

  clearCache(): void {
    clearSupervisorApiCache();
  },
};
