export type StudentProjectStatus = 'ACTIVE' | 'AT_RISK' | 'PLANNING';

export type StudentProjectSummary = {
  id: string;
  title: string;
  summary: string | null;
  status: StudentProjectStatus;
  batch: string | null;
  semester: string | null;
  milestoneDate: string | null;
  lastActivityAt: string | null;
  progressPercent: number | null;
  supervisorName: string | null;
};

export type StudentProjectTab =
  | 'overview'
  | 'team'
  | 'activity'
  | 'meetings'
  | 'action-items'
  | 'files';

export type StudentProjectMetric = {
  label: string;
  value: string;
};

export type StudentProjectIntegration = {
  label: string;
  status: 'Connected' | 'Needs attention' | 'Optional';
  href?: string;
};

export type StudentProjectActivity = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
};

export type StudentProjectMeeting = {
  id: string;
  title: string;
  scheduledFor: string;
  status: 'Approved' | 'Pending' | 'Draft';
  notes: string;
};

export type StudentProjectActionItem = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'Done' | 'In progress' | 'Blocked';
};

export type StudentProjectFile = {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
};

export type StudentProject = {
  id: string;
  title: string;
  summary: string;
  status: StudentProjectStatus;
  batch: string;
  semester: string;
  milestoneDate: string;
  lastUpdatedAt: string;
  communicationUrl?: string;
  repositoryUrl?: string;
  jiraBoardUrl?: string;
  highlights: string[];
  teamMembers: string[];
  metrics: StudentProjectMetric[];
  integrations: StudentProjectIntegration[];
  activity: StudentProjectActivity[];
  meetings: StudentProjectMeeting[];
  actionItems: StudentProjectActionItem[];
  files: StudentProjectFile[];
};
