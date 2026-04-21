import { Card } from '@/components/ui/Card';
import type { SupervisorDashboard } from '../../types';

function DashboardStatsSkeleton() {
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-7">
      {Array.from({ length: 7 }).map((_, index) => (
        <Card
          key={`dashboard-stat-skeleton-${index}`}
          className="animate-pulse rounded-2xl"
          padding="md"
        >
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="mt-3 h-8 w-12 rounded bg-slate-200" />
        </Card>
      ))}
    </section>
  );
}

type DashboardStatsSectionProps = {
  dashboard: SupervisorDashboard | null;
  isLoading: boolean;
};

export function DashboardStatsSection({ dashboard, isLoading }: DashboardStatsSectionProps) {
  if (isLoading || !dashboard) {
    return <DashboardStatsSkeleton />;
  }

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-7">
      <Card className="rounded-2xl" padding="md">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Total projects
        </p>
        <p className="mt-3 text-3xl font-semibold text-foreground">{dashboard.totalProjects}</p>
      </Card>
      <Card className="rounded-2xl" padding="md">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Active
        </p>
        <p className="mt-3 text-3xl font-semibold text-foreground">{dashboard.activeProjects}</p>
      </Card>
      <Card className="rounded-2xl" padding="md">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          At risk
        </p>
        <p className="mt-3 text-3xl font-semibold text-foreground">{dashboard.atRiskProjects}</p>
      </Card>
      <Card className="rounded-2xl" padding="md">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Behind
        </p>
        <p className="mt-3 text-3xl font-semibold text-foreground">{dashboard.behindProjects}</p>
      </Card>
      <Card className="rounded-2xl" padding="md">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Upcoming milestones
        </p>
        <p className="mt-3 text-3xl font-semibold text-foreground">
          {dashboard.upcomingMilestonesCount}
        </p>
      </Card>
      <Card className="rounded-2xl border-l-2 border-l-amber-300" padding="md">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Jira at risk
        </p>
        <p className="mt-3 text-3xl font-semibold text-amber-600">{dashboard.jiraAtRiskCount}</p>
      </Card>
      <Card className="rounded-2xl border-l-2 border-l-rose-300" padding="md">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Jira behind
        </p>
        <p className="mt-3 text-3xl font-semibold text-rose-600">{dashboard.jiraBehindCount}</p>
      </Card>
    </section>
  );
}
