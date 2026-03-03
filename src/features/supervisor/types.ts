export type SupervisorProjectLifecycle = 'PLANNING' | 'ACTIVE' | 'AT_RISK' | 'BEHIND' | 'COMPLETED';

export type SupervisorProjectTab =
  | 'overview'
  | 'team'
  | 'activity'
  | 'meetings'
  | 'action-items'
  | 'files';

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
  repositoryUrl?: string;
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
