import { apiClient } from '@/services/apiClient';
import type { StudentProjectSummary } from '../types';

const cachedStudentProjects: { value: StudentProjectSummary[] | null } = { value: null };
const inFlightStudentProjects: { value: Promise<StudentProjectSummary[]> | null } = { value: null };

export function invalidateStudentProjectsCache() {
  cachedStudentProjects.value = null;
  inFlightStudentProjects.value = null;
}

export const studentApi = {
  async getProjects(forceRefresh = false): Promise<StudentProjectSummary[]> {
    if (!forceRefresh && cachedStudentProjects.value) {
      return cachedStudentProjects.value;
    }

    if (!forceRefresh && inFlightStudentProjects.value) {
      return inFlightStudentProjects.value;
    }

    const request = apiClient.get<StudentProjectSummary[]>('/api/student/projects');
    inFlightStudentProjects.value = request;

    try {
      const projects = await request;
      cachedStudentProjects.value = projects;
      return projects;
    } finally {
      inFlightStudentProjects.value = null;
    }
  },
};
