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
  healthNote: string | null;
  memberCount: number;
};

export type SupervisorProjectDetailMember = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  registrationNumber: string | null;
  memberRole: 'SUPERVISOR' | 'STUDENT';
};

export type SupervisorProjectDetailMilestone = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  sequenceNo: number;
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
  healthNote: string | null;
  lastActivityAt: string | null;
  repositoryUrl?: string | null;
  members: SupervisorProjectDetailMember[];
  milestones: SupervisorProjectDetailMilestone[];
};

export type SupervisorProjectTab =
  | 'overview'
  | 'team'
  | 'activity'
  | 'meetings'
  | 'action-items'
  | 'files';

export type SupervisorProjectDetailTab = 'overview' | 'team' | 'milestones';

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
  healthNote: string;
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

export type SupervisorDashboardStats = {
  total: number;
  active: number;
  atRisk: number;
  behind: number;
  overdueActions: number;
};

export type SupervisorDashboardProjectItem = {
  id: string;
  title: string;
  summary: string | null;
  lifecycleStatus: SupervisorProjectLifecycle;
  milestoneDate: string | null;
  lastActivityAt: string | null;
  progressPercent: number | null;
  healthNote: string | null;
};

export type SupervisorDashboard = {
  totalProjects: number;
  planningProjects: number;
  activeProjects: number;
  atRiskProjects: number;
  behindProjects: number;
  completedProjects: number;
  upcomingMilestonesCount: number;
  projects: SupervisorDashboardProjectItem[];
  recentProjects: SupervisorDashboardProjectItem[];
};

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
  milestone: {
    title: string;
    description: string;
    dueDate: string;
  };
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
  milestone: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
    sequenceNo: number;
  };
};

export type UpdateSupervisorProjectRequest = {
  title: string;
  summary: string;
  batch: string;
  semester: string;
  lifecycleStatus: SupervisorProjectLifecycle;
  healthNote: string | null;
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
  status: SupervisorProjectDetailMilestone['status'];
};

export type UpdateSupervisorProjectStatusRequest = {
  lifecycleStatus: SupervisorProjectLifecycle;
};

export type UpdateRepositoryRequest = {
  repositoryUrl: string | null;
};
