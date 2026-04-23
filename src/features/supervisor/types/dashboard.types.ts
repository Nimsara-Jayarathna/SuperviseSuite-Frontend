import type { SupervisorProjectLifecycle } from './project.types';

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
