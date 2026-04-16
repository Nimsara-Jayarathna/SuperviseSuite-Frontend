import type { ProjectGitHubPreview } from '@/features/projects/types';
import type { UserRole } from '@/types/roles';
import type { ProjectFile, ProjectFileConfig } from '@/features/projectfiles/types';

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

export type ProjectGitHubActivity = ProjectGitHubPreview;

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
  files: {
    items: ProjectFile[];
    config: ProjectFileConfig;
  } | null;
};

export type JiraAuthUrl = {
  url: string;
};

export type JiraOAuthCompletePayload = {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  errorDescription?: string | null;
  selectionToken?: string | null;
  selectedCloudId?: string | null;
};

export type JiraWorkspaceOption = {
  cloudId: string;
  workspaceName: string;
  workspaceUrl: string | null;
};

export type JiraOAuthCompleteResult = {
  projectId: string;
  workspaceName: string | null;
  requiresWorkspaceSelection: boolean;
  selectionToken: string | null;
  workspaceOptions: JiraWorkspaceOption[];
};

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

/**
 * Per-member row in the Team Workload comparison table and bar chart.
 *
 * Story-point fields are `null` — not `0` — when story points are not
 * configured in the connected Jira project. The UI renders `—` for null values.
 *
 * `openIssues` is pre-computed by the backend (`assigned − completed`) and
 * drives both the bar-chart widths and the default sort order of the table.
 */
export type JiraWorkloadMemberRow = {
  /** Stable Jira account identifier. */
  accountId: string;
  /** Human-readable name shown in the table and bar chart. */
  displayName: string;
  /** Total issues attributed to this member (includes completed). */
  assigned: number;
  /** Issues in a "done" status category. */
  completed: number;
  /** Issues currently in an "in-progress" status category. */
  inProgress: number;
  /**
   * Open issues past their due date (or past the 7-day activity-recency
   * threshold when no due dates are set in the project).
   */
  overdue: number;
  /**
   * Open issue count (assigned − completed). Pre-computed by the backend.
   * Drives bar-chart proportional widths and row sort order.
   */
  openIssues: number;
  /** Total story points on all attributed issues. `null` when not configured. */
  storyPointsAssigned: number | null;
  /** Story points on completed issues only. `null` when not configured. */
  storyPointsCompleted: number | null;
  /**
   * Percentage of assigned issues that are completed (0–100).
   * `0` when `assigned` is zero.
   */
  completionRate: number;
  /**
   * ISO 8601 instant of the most recent `jiraUpdatedAt` across attributed
   * issues. Used to compute "last active N hours/days ago" in the UI.
   */
  lastActiveDate: string;
  /** Lookup dictionary counting issues by their Jira type (e.g., 'Story': 1) */
  issueTypeCounts: Record<string, number>;
};

/**
 * Team workload snapshot for a project's Jira tab.
 *
 * - `members` — sorted by `openIssues` descending; empty when no assignees exist.
 * - `unassignedCount` — independent of `members`; non-zero even when `members` is empty.
 * - `dueDateAvailable` — when `false`, overdue values are estimated from activity
 *   recency and the UI renders an "estimate" badge on the Overdue column header.
 * - `imbalanceDetected` / `imbalanceMessage` — drive the conditional alert banner.
 */
export type JiraWorkload = {
  /** Per-member rows sorted by open issues descending. */
  members: JiraWorkloadMemberRow[];
  /**
   * Issues with no Jira assignee. Shown in the unassigned warning card
   * independently — visible even when `members` is empty.
   */
  unassignedCount: number;
  /**
   * `true` when at least one issue in the project has a due date set in Jira.
   * When `false`, the Overdue column header renders an "estimate" badge.
   */
  dueDateAvailable: boolean;
  /**
   * `true` when one member has more than 3× the open issues of another
   * AND the most-burdened member has at least 3 open issues.
   */
  imbalanceDetected: boolean;
  /**
   * Human-readable imbalance description, e.g.
   * "Alice has 3x more open issues than Bob".
   * `null` when `imbalanceDetected` is `false`.
   */
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
  jiraHealthIndicator: 'AT_RISK' | 'BEHIND' | 'HEALTHY' | 'NOT_CONNECTED' | null;
};

export type SupervisorDashboard = {
  totalProjects: number;
  planningProjects: number;
  activeProjects: number;
  atRiskProjects: number;
  behindProjects: number;
  completedProjects: number;
  upcomingMilestonesCount: number;
  jiraAtRiskCount: number;
  jiraBehindCount: number;
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
  healthNote: string | null;
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
  status: SupervisorProjectDetailMilestone['status'];
};

export type UpdateSupervisorProjectStatusRequest = {
  lifecycleStatus: SupervisorProjectLifecycle;
};

export type UpdateRepositoryRequest = {
  repositoryUrl: string | null;
};

export type GitHubInstallationRepository = {
  repositoryId: number;
  name: string;
  fullName: string;
  url: string;
  ownerLogin: string;
  defaultBranch: string;
};

export type GitHubInstallationRepositoriesPage = {
  items: GitHubInstallationRepository[];
  page: number;
  size: number;
  returnedCount: number;
  totalCount: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage: number | null;
};

export type LinkProjectGitHubRepositoryRequest = {
  installationId: number;
  repositoryId: number;
};

export type ProjectGitHubRepositoryLink = {
  projectId: string;
  installationId: number;
  repositoryId: number;
  name: string;
  fullName: string;
  url: string;
  ownerLogin: string;
  defaultBranch: string;
  lastSyncedAt: string | null;
};

export type GitHubRepositoryAccessRequestCreate = {
  projectId: string;
  requestToken: string;
  requestUrl: string;
  expiresAt: string;
};

export type GitHubRepositoryAccessRequestValidation = {
  projectId: string;
  projectTitle: string;
  status: string;
  expiresAt: string;
};

export type GitHubRepositoryAccessRequestContinue = {
  projectId: string;
  githubAuthorizeUrl: string;
};

export type GitHubAccessUpdatedSummary = {
  projectId: string;
  projectTitle: string;
  installationId: number;
  sourceId?: string | null;
  flowType?: 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED' | null;
  accessScope: string;
  accessibleRepositoryCount: number;
  repositories: GitHubInstallationRepository[];
};

export type GitHubAccessUpdatedAcknowledge = {
  projectId: string;
};

export type GitHubAccessType = 'PUBLIC_URL' | 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED';
export type GitHubOwnerType = 'USER' | 'ORG';
export type GitHubSyncStatus = 'IN_PROGRESS' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'DISABLED';

export type GitHubAccessSource = {
  id: string;
  projectId: string;
  installationId: number | null;
  ownerLogin: string;
  ownerType: GitHubOwnerType;
  accessType: GitHubAccessType;
  active: boolean;
  createdAt: string;
};

export type GitHubRepositoryOption = {
  id: string;
  githubRepoId: number;
  fullName: string;
  name: string;
  ownerLogin: string;
  defaultBranch: string | null;
  url: string;
};

export type GitHubAvailableRepositories = {
  sourceId: string;
  items: GitHubRepositoryOption[];
  totalCount: number;
};

export type LinkGitHubRepositoriesPayload = {
  projectId: string;
  sourceId: string;
  repositories: Array<{
    githubRepositoryId: string;
    customName?: string | null;
    primary?: boolean;
  }>;
};

export type ProjectRepositoryLink = {
  id: string;
  sourceId: string | null;
  accessType?: GitHubAccessType | string | null;
  githubRepositoryId: string | null;
  githubRepoId: number;
  fullName: string | null;
  name: string | null;
  customName: string | null;
  ownerLogin: string | null;
  defaultBranch: string | null;
  url: string | null;
  primary: boolean;
  enabled: boolean;
  linkedAt: string;
  lastSyncedAt: string | null;
  syncStatus: GitHubSyncStatus | null;
};

export type ProjectGitHubRepositories = {
  projectId: string;
  maxLinkedRepositories: number;
  maxEnabledRepositories: number;
  accessSources: GitHubAccessSource[];
  repositories: ProjectRepositoryLink[];
};

export type GitHubInstallStart = {
  projectId: string;
  githubAuthorizeUrl: string;
  flowType: 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED';
  expiresAt: string;
};

export type GitHubAccessRequestCreateV2 = {
  projectId: string;
  requestUrl: string;
  expiresAt: string;
};
export type ProjectGitHubRepositoryListing = {
  projectId: string;
  inventory: GitHubAvailableRepositories[];
};
