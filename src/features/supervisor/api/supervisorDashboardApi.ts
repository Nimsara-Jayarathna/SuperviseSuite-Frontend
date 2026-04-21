import type { SupervisorDashboard } from '../types';

type ApiClient = typeof import('@/services/apiClient').apiClient;

type CreateSupervisorDashboardApiDeps = {
  apiClient: ApiClient;
};

export function createSupervisorDashboardApi({ apiClient }: CreateSupervisorDashboardApiDeps) {
  return {
    getDashboard(): Promise<SupervisorDashboard> {
      return apiClient.get<SupervisorDashboard>('/api/supervisor/dashboard');
    },
  };
}
