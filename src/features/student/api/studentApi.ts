import { apiClient } from '@/services/apiClient';
import type { StudentProjectDetail, StudentProjectSummary, ProjectCommitActivity } from '../types';

const cachedProjectsById: Partial<Record<string, StudentProjectDetail>> = {};
const inFlightProjectRequests: Partial<Record<string, Promise<StudentProjectDetail>>> = {};
const cachedProjectCommitsById: Partial<Record<string, ProjectCommitActivity>> = {};
const inFlightProjectCommitRequests: Partial<Record<string, Promise<ProjectCommitActivity>>> = {};

export const studentApi = {
  getProjects(): Promise<StudentProjectSummary[]> {
    return apiClient.get<StudentProjectSummary[]>('/api/student/projects');
  },

  async getProjectCommits(projectId: string, forceRefresh = false): Promise<ProjectCommitActivity> {
    if (!forceRefresh && cachedProjectCommitsById[projectId]) {
      return cachedProjectCommitsById[projectId];
    }

    if (!forceRefresh && inFlightProjectCommitRequests[projectId]) {
      return inFlightProjectCommitRequests[projectId];
    }

    const request = apiClient.get<ProjectCommitActivity>(
      `/api/student/projects/${projectId}/commits`,
    );
    inFlightProjectCommitRequests[projectId] = request;

    try {
      const activity = await request;
      cachedProjectCommitsById[projectId] = activity;
      return activity;
    } finally {
      delete inFlightProjectCommitRequests[projectId];
    }
  },

  async getProjectById(projectId: string, forceRefresh = false): Promise<StudentProjectDetail> {
    if (!forceRefresh && cachedProjectsById[projectId]) {
      return cachedProjectsById[projectId];
    }

    if (!forceRefresh && inFlightProjectRequests[projectId]) {
      return inFlightProjectRequests[projectId];
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
