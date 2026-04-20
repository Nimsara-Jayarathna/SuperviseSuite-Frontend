type ApiClient = typeof import('@/services/apiClient').apiClient;

type CreateSupervisorMeApiDeps = {
  apiClient: ApiClient;
};

export function createSupervisorMeApi({ apiClient }: CreateSupervisorMeApiDeps) {
  return {
    changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
      return apiClient.patch<void>('/api/supervisor/me/password', payload);
    },
  };
}
