import type { SupervisorDashboard } from '../../types';
import { DashboardStatCard } from './DashboardStatCard';

const DASHBOARD_STATS = [
  {
    key: 'totalProjects',
    label: 'Total projects',
    tone: 'primary',
    getValue: (dashboard: SupervisorDashboard) => dashboard.totalProjects,
  },
  {
    key: 'activeProjects',
    label: 'Active',
    tone: 'success',
    getValue: (dashboard: SupervisorDashboard) => dashboard.activeProjects,
  },
  {
    key: 'atRiskProjects',
    label: 'At risk',
    tone: 'warning',
    getValue: (dashboard: SupervisorDashboard) => dashboard.atRiskProjects,
  },
  {
    key: 'behindProjects',
    label: 'Behind',
    tone: 'danger',
    getValue: (dashboard: SupervisorDashboard) => dashboard.behindProjects,
  },
  {
    key: 'upcomingMilestonesCount',
    label: 'Upcoming milestones',
    tone: 'info',
    getValue: (dashboard: SupervisorDashboard) => dashboard.upcomingMilestonesCount,
  },
  {
    key: 'jiraAtRiskCount',
    label: 'Jira at risk',
    tone: 'warning',
    getValue: (dashboard: SupervisorDashboard) => dashboard.jiraAtRiskCount,
  },
  {
    key: 'jiraBehindCount',
    label: 'Jira behind',
    tone: 'danger',
    getValue: (dashboard: SupervisorDashboard) => dashboard.jiraBehindCount,
  },
] as const;

type DashboardStatsSectionProps = {
  dashboard: SupervisorDashboard | null;
  isLoading: boolean;
};

export function DashboardStatsSection({ dashboard, isLoading }: DashboardStatsSectionProps) {
  const showSkeleton = isLoading || !dashboard;

  return (
    <section className="grid grid-cols-2 auto-rows-fr gap-3 sm:gap-4 xl:grid-cols-7">
      {DASHBOARD_STATS.map((stat) => (
        <DashboardStatCard
          key={stat.key}
          label={stat.label}
          tone={stat.tone}
          value={showSkeleton || !dashboard ? undefined : stat.getValue(dashboard)}
          loading={showSkeleton}
        />
      ))}
    </section>
  );
}
