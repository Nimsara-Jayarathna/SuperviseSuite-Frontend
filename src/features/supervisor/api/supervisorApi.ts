import { apiClient } from '@/services/apiClient';
import type {
  CreateSupervisorProjectRequest,
  CreateSupervisorProjectResponse,
  SupervisorStudentSearchResult,
} from '../types';

export const supervisorApi = {
  searchStudents(query: string): Promise<SupervisorStudentSearchResult[]> {
    const params = new URLSearchParams({ q: query });
    return apiClient.get<SupervisorStudentSearchResult[]>(
      `/api/supervisor/students/search?${params.toString()}`,
    );
  },

  createProject(body: CreateSupervisorProjectRequest): Promise<CreateSupervisorProjectResponse> {
    return apiClient.post<CreateSupervisorProjectResponse>('/api/supervisor/projects', body);
  },
};
