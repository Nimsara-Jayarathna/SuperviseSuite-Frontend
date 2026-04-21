import type { SupervisorStudentSearchResult } from '../types';

type ApiClient = typeof import('@/services/apiClient').apiClient;

type CreateSupervisorStudentsApiDeps = {
  apiClient: ApiClient;
};

export function createSupervisorStudentsApi({ apiClient }: CreateSupervisorStudentsApiDeps) {
  return {
    searchStudents(query: string): Promise<SupervisorStudentSearchResult[]> {
      const params = new URLSearchParams({ q: query });
      return apiClient.get<SupervisorStudentSearchResult[]>(
        `/api/supervisor/students/search?${params.toString()}`,
      );
    },
  };
}
