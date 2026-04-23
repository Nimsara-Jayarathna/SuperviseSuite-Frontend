import type { ProjectGitHubPreview } from '@/features/projects/types';
import type { ProjectFile, ProjectFileConfig } from '@/features/projectfiles/types';
import type { UserRole } from '@/types/roles';
import type { ProjectGitHubRepositories } from './github.types';

export type SupervisorProjectLifecycle = 'PLANNING' | 'ACTIVE' | 'AT_RISK' | 'BEHIND' | 'COMPLETED';

export type SupervisorProjectSummary = {
  id: string;
  title: string;
  summary: string | null;
  lifecycleStatus: SupervisorProjectLifecycle;
  batch: string | null;
  semester: string | null;
  milestoneDate: string | null;
  progressPercent: number | null;
  memberCount: number;
};

export type SupervisorProjectDetailMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  registrationNumber: string | null;
  memberRole: UserRole;
};

export type SupervisorProjectLeader = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  registrationNumber: string | null;
};

export type SupervisorProjectDetailMilestone = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  sequenceNo: number;
  isOverdue?: boolean;
  daysOverdue?: number;
  isChronologyViolation?: boolean;
};

export type SupervisorProjectMilestoneInsights = {
  overdueOpenMilestones: number;
  dueSoonCount: number;
  timelineRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string;
};

export type SupervisorProjectDetail = {
  id: string;
  title: string;
  summary: string | null;
  lifecycleStatus: SupervisorProjectLifecycle;
  batch: string | null;
  semester: string | null;
  milestoneDate: string | null;
  progressPercent: number | null;
  lastActivityAt: string | null;
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
  leader: SupervisorProjectLeader | null;
  members: SupervisorProjectDetailMember[];
  milestones: SupervisorProjectDetailMilestone[];
  milestoneInsights?: SupervisorProjectMilestoneInsights | null;
  files: {
    items: ProjectFile[];
    config: ProjectFileConfig;
  } | null;
};

export type SupervisorProjectTab =
  | 'overview'
  | 'team'
  | 'activity'
  | 'meetings'
  | 'action-items'
  | 'files';

export type SupervisorProjectDetailTab =
  | 'overview'
  | 'team'
  | 'milestones'
  | 'files'
  | 'github'
  | 'integrations'
  | 'jira'
  | 'meetings';

// Legacy / UI-only aggregate types (used by older components or mock views).
export type SupervisorProjectMember = {
  id: string;
  name: string;
  role: 'Student' | 'Supervisor';
};

export type SupervisorProjectMetric = {
  label: string;
  value: string;
};

export type SupervisorProjectIntegration = {
  label: string;
  status: 'Connected' | 'Needs setup' | 'Issue';
  href?: string;
};

export type SupervisorProjectEvent = {
  id: string;
  title: string;
  summary: string;
  occurredAt: string;
};

export type SupervisorProjectContribution = {
  memberId: string;
  commits: number;
  pullRequests: number;
};

export type SupervisorProjectMeeting = {
  id: string;
  title: string;
  scheduledFor: string;
  status: 'Approved' | 'Submitted' | 'Draft';
  summary: string;
};

export type SupervisorProjectActionItem = {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In Progress' | 'Done';
  jiraKey?: string;
};

export type SupervisorProjectFile = {
  id: string;
  name: string;
  uploadedBy: string;
  updatedAt: string;
  sizeLabel: string;
  type: string;
};

export type SupervisorProject = {
  id: string;
  title: string;
  summary: string;
  lifecycle: SupervisorProjectLifecycle;
  batch: string;
  semester: string;
  milestoneDate: string;
  lastActivityAt: string;
  progress: number;
  communicationUrl?: string;
  repositoryUrl?: string | null;
  jiraBoardUrl?: string;
  members: SupervisorProjectMember[];
  metrics: SupervisorProjectMetric[];
  integrations: SupervisorProjectIntegration[];
  highlights: string[];
  events: SupervisorProjectEvent[];
  activityWeeks: number[];
  contributions: SupervisorProjectContribution[];
  meetings: SupervisorProjectMeeting[];
  actionItems: SupervisorProjectActionItem[];
  files: SupervisorProjectFile[];
};
