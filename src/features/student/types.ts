import type { ProjectGitHubPreview } from '@/features/projects/types';
import type { ProjectGitHubRepositories } from '@/features/shared/types/github.types';
import type { UserRole } from '@/types/roles';
import type { ProjectFile, ProjectFileConfig } from '@/features/projectfiles/types';

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

export type ProjectGitHubActivity = ProjectGitHubPreview;

export type StudentProjectDetailMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  registrationNumber: string | null;
  memberRole: UserRole;
};

export type StudentProjectDetailMilestone = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  sequenceNo: number;
};

export type StudentProjectDetailLeader = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  registrationNumber: string | null;
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
  repositoryUrl?: string | null;
  github: ProjectGitHubPreview;
  githubRepositories?: ProjectGitHubRepositories | null;
  jira?: {
    connected: boolean;
    workspaceName: string | null;
    workspaceUrl?: string | null;
    lastSyncedAt?: string | null;
    syncStatus?: string | null;
  } | null;
  leader: StudentProjectDetailLeader | null;
  members: StudentProjectDetailMember[];
  milestones: StudentProjectDetailMilestone[];
  files: {
    items: ProjectFile[];
    config: ProjectFileConfig;
  } | null;
};

export type StudentProjectDetailTab =
  | 'overview'
  | 'team'
  | 'milestones'
  | 'files'
  | 'github'
  | 'jira'
  | 'meetings';
