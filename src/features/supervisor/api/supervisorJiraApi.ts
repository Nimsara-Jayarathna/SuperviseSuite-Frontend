import type { createRoleProjectApi } from '@/features/shared/api/createRoleProjectApi';
import type {
  JiraAuthUrl,
  JiraHealth,
  JiraOAuthCompletePayload,
  JiraOAuthCompleteResult,
  SupervisorProjectDetail,
} from '../types';

type RoleProjectApi = Omit<ReturnType<typeof createRoleProjectApi>, 'clearCache'>;
type ApiClient = typeof import('@/services/apiClient').apiClient;

type CreateSupervisorJiraApiDeps = {
  apiClient: ApiClient;
  roleProjectApi: RoleProjectApi;
};

export function createSupervisorJiraApi({
  apiClient,
  roleProjectApi,
}: CreateSupervisorJiraApiDeps) {
  return {
    getProjectJiraAuthUrl(projectId: string): Promise<JiraAuthUrl> {
      return apiClient.get<JiraAuthUrl>(`/api/supervisor/projects/${projectId}/jira/auth-url`);
    },

    completeJiraOAuth(payload: JiraOAuthCompletePayload): Promise<JiraOAuthCompleteResult> {
      return apiClient.post<JiraOAuthCompleteResult>(
        '/api/supervisor/jira/oauth/complete',
        payload,
      );
    },

    disconnectProjectJira(projectId: string): Promise<SupervisorProjectDetail> {
      return apiClient.post<SupervisorProjectDetail>(
        `/api/supervisor/projects/${projectId}/jira/disconnect`,
        {},
      );
    },

    async refreshProjectJira(projectId: string): Promise<JiraHealth> {
      const fresh = await apiClient.post<JiraHealth>(
        `/api/supervisor/projects/${projectId}/jira/refresh`,
        {},
      );
      roleProjectApi.invalidateJiraCache(projectId);
      roleProjectApi.primeJiraHealth(projectId, fresh);
      return fresh;
    },
  };
}
