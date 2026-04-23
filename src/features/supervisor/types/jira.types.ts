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

export type {
  JiraHealth,
  JiraHierarchy,
  JiraHierarchyNode,
  JiraSprintProgress,
  JiraSprintSummary,
  JiraStatusBreakdown,
  JiraTypeDistributionItem,
  JiraVelocityWeek,
  JiraWorkload,
  JiraWorkloadMemberRow,
} from '@/features/shared/types/jira.types';
