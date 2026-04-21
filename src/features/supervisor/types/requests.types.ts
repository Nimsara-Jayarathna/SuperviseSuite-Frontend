import type { SupervisorProjectLifecycle, SupervisorProjectLeader } from './project.types';

export type SupervisorStudentSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
};

export type CreateSupervisorProjectRequest = {
  title: string;
  summary: string;
  batch: string;
  semester: string;
  studentIds: string[];
  leaderStudentId?: string | null;
  milestones: Array<{
    title: string;
    description: string;
    dueDate: string;
  }>;
};

export type CreateSupervisorProjectResponse = {
  id: string;
  title: string;
  summary: string;
  batch: string;
  semester: string;
  lifecycleStatus: SupervisorProjectLifecycle | 'PLANNING';
  progressPercent: number;
  milestoneDate: string;
  students: SupervisorStudentSearchResult[];
  leader: SupervisorProjectLeader | null;
  milestones: Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
    sequenceNo: number;
  }>;
};

export type UpdateSupervisorProjectRequest = {
  title: string;
  summary: string;
  batch: string;
  semester: string;
  lifecycleStatus: SupervisorProjectLifecycle;
  leaderStudentId?: string | null;
};

export type AddSupervisorProjectMembersRequest = {
  studentIds: string[];
};

export type AddSupervisorProjectMilestoneRequest = {
  title: string;
  description: string | null;
  dueDate: string;
};

export type UpdateSupervisorProjectMilestoneRequest = {
  title: string;
  description: string | null;
  dueDate: string;
  status: import('./project.types').SupervisorProjectDetailMilestone['status'];
};

export type UpdateSupervisorProjectStatusRequest = {
  lifecycleStatus: SupervisorProjectLifecycle;
};

export type UpdateRepositoryRequest = {
  repositoryUrl: string | null;
};
