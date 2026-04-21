export type JiraStatusBreakdown = {
  toDo: number;
  inProgress: number;
  done: number;
};

export type JiraTypeDistributionItem = {
  type: string;
  count: number;
};

export type JiraHealth = {
  completionPercent: number;
  openIssues: number;
  overdueIssues: number;
  highPriorityOpen: number;
  statusBreakdown: JiraStatusBreakdown;
  typeDistribution: JiraTypeDistributionItem[];
  bugRatio: number;
  lastSyncedAt: string | null;
};

export type JiraSprintSummary = {
  sprintId: number | null;
  sprintName: string | null;
  sprintState: string | null;
  startDate: string | null;
  endDate: string | null;
  sprintStartIssueCount: number | null;
  completionPercent: number;
  issuesDone: number;
  issuesTotal: number;
  sprintPointsDone: number;
  sprintPointsTotal: number;
  sprintPointsAvailable: boolean;
};

export type JiraVelocityWeek = {
  weekStart: string;
  created: number;
  resolved: number;
  averageCycleDays: number | null;
};

export type JiraSprintProgress = {
  activeSprint: JiraSprintSummary | null;
  recentSprints: JiraSprintSummary[];
  velocityWeeks: JiraVelocityWeek[];
  backlogGrowing: boolean;
  sprintDataAvailable: boolean;
};

export type JiraWorkloadMemberRow = {
  accountId: string;
  displayName: string;
  assigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  openIssues: number;
  storyPointsAssigned: number | null;
  storyPointsCompleted: number | null;
  completionRate: number;
  lastActiveDate: string;
  issueTypeCounts: Record<string, number>;
};

export type JiraWorkload = {
  members: JiraWorkloadMemberRow[];
  unassignedCount: number;
  dueDateAvailable: boolean;
  imbalanceDetected: boolean;
  imbalanceMessage: string | null;
};

export type JiraHierarchyNode = {
  issueKey: string;
  summary: string;
  issueType: string;
  status: string;
  priority: string | null;
  assigneeDisplayName: string | null;
  storyPoints: number | null;
  children: JiraHierarchyNode[];
};

export type JiraHierarchy = {
  roots: JiraHierarchyNode[];
  orphans: JiraHierarchyNode[];
};
