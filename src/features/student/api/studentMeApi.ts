type ApiClient = typeof import('@/services/apiClient').apiClient;

type CreateStudentMeApiDeps = {
  apiClient: ApiClient;
};

export function createStudentMeApi({ apiClient }: CreateStudentMeApiDeps) {
  return {
    changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
      return apiClient.patch<void>('/api/student/me/password', payload);
    },
  };
}
