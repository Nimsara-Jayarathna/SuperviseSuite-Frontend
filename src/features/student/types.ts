export type StudentProjectLifecycle = 'PLANNING' | 'ACTIVE' | 'AT_RISK' | 'BEHIND' | 'COMPLETED';

export type StudentProjectSummary = {
  id: string;
  title: string;
  summary: string | null;
  status: StudentProjectLifecycle;
  batch: string | null;
  semester: string | null;
  milestoneDate: string | null;
  lastActivityAt: string | null;
  progressPercent: number | null;
  supervisorName: string | null;
};

export type StudentProjectDetailMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  registrationNumber: string | null;
  memberRole: 'SUPERVISOR' | 'STUDENT';
};

export type StudentProjectDetailMilestone = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  sequenceNo: number;
};

export type StudentProjectDetail = {
  id: string;
  title: string;
  summary: string | null;
  status: StudentProjectLifecycle;
  batch: string | null;
  semester: string | null;
  milestoneDate: string | null;
  lastActivityAt: string | null;
  progressPercent: number | null;
  healthNote: string | null;
  repositoryUrl?: string | null;
  members: StudentProjectDetailMember[];
  milestones: StudentProjectDetailMilestone[];
};

export type StudentProjectDetailTab = 'overview' | 'team' | 'milestones';
