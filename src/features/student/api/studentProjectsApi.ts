import type { StudentProjectDetail, StudentProjectSummary } from '../types';

type ApiClient = typeof import('@/services/apiClient').apiClient;

type StudentProjectCache = Partial<Record<string, StudentProjectDetail>>;
type StudentProjectInFlight = Partial<Record<string, Promise<StudentProjectDetail>>>;

type CreateStudentProjectsApiDeps = {
  apiClient: ApiClient;
  cachedProjectsById: StudentProjectCache;
  inFlightProjectRequests: StudentProjectInFlight;
};

export function createStudentProjectsApi({
  apiClient,
  cachedProjectsById,
  inFlightProjectRequests,
}: CreateStudentProjectsApiDeps) {
  return {
    getProjects(): Promise<StudentProjectSummary[]> {
      return apiClient.get<StudentProjectSummary[]>('/api/student/projects');
    },

    async getProjectById(projectId: string, forceRefresh = false): Promise<StudentProjectDetail> {
      if (!forceRefresh && cachedProjectsById[projectId]) {
        return cachedProjectsById[projectId] as StudentProjectDetail;
      }

      if (!forceRefresh && inFlightProjectRequests[projectId]) {
        return inFlightProjectRequests[projectId] as Promise<StudentProjectDetail>;
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
}
