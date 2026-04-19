import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBlockingError } from '@/app/layout/BlockingErrorContext';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { isBlockingError } from '@/utils/errorSeverity';
import { useSupervisorDashboard } from '../hooks/useSupervisorDashboard';
import type { SupervisorDashboardProjectItem } from '../types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const UPCOMING_WINDOW_DAYS = 14;
const ATTENTION_LIST_LIMIT = 4;
const UPCOMING_LIST_LIMIT = 5;

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function statusClasses(status: string) {
  if (status === 'ACTIVE') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'AT_RISK') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'BEHIND') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'COMPLETED') return 'border-slate-300 bg-slate-100 text-slate-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
}

function jiraIndicatorClasses(indicator: string | null) {
  if (indicator === 'AT_RISK') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (indicator === 'BEHIND') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (indicator === 'HEALTHY') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-100 text-slate-400';
}

function jiraIndicatorLabel(indicator: string | null) {
  if (indicator === 'AT_RISK') return 'At Risk';
  if (indicator === 'BEHIND') return 'Behind';
  if (indicator === 'HEALTHY') return 'Healthy';
  if (indicator === 'NOT_CONNECTED') return 'Not linked';
  return '-';
}

function formatMilestoneDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : 'Not set';
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function milestoneDeltaDays(value: string | null, today: Date): number | null {
  if (!value) return null;
  const parsed = parseLocalDate(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.round((parsed.getTime() - today.getTime()) / DAY_IN_MS);
}

function staleDays(value: string | null, now: Date): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / DAY_IN_MS));
}

function upcomingWindowLabel(daysUntil: number): string {
  if (daysUntil < 0) {
    const overdue = Math.abs(daysUntil);
    return overdue === 1 ? '1 day overdue' : `${overdue} days overdue`;
  }
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  return `Due in ${daysUntil} days`;
}

function upcomingWindowClasses(daysUntil: number): string {
  if (daysUntil < 0) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (daysUntil <= 3) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (daysUntil <= UPCOMING_WINDOW_DAYS) return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

type AttentionItem = {
  project: SupervisorDashboardProjectItem;
  score: number;
  reasons: string[];
  summaryText: string;
  severity: 'critical' | 'warning';
  daysUntilMilestone: number | null;
  inactivityDays: number | null;
};

function attentionSummaryText(
  project: SupervisorDashboardProjectItem,
  daysUntilMilestone: number | null,
): string {
  if (daysUntilMilestone !== null && daysUntilMilestone < 0) {
    const overdueDays = Math.abs(daysUntilMilestone);
    return overdueDays === 1
      ? 'Primary milestone is overdue by 1 day and requires recovery.'
      : `Primary milestone is overdue by ${overdueDays} days and requires recovery.`;
  }

  if (project.lifecycleStatus === 'BEHIND') {
    return 'Lifecycle is behind. Prioritize blocker removal and milestone recovery.';
  }
  if (project.lifecycleStatus === 'AT_RISK') {
    return 'Lifecycle is at risk. Confirm owners and protect near-term scope.';
  }

  if (daysUntilMilestone !== null && daysUntilMilestone <= 7) {
    if (daysUntilMilestone === 0) {
      return 'Primary milestone is due today. Run a readiness check now.';
    }
    if (daysUntilMilestone === 1) {
      return 'Primary milestone is due tomorrow. Validate readiness today.';
    }
    return `Primary milestone is due in ${daysUntilMilestone} days. Validate readiness this week.`;
  }

  return 'Execution signals indicate this project should be reviewed this cycle.';
}

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

function ProjectHealthMobileCard({ project }: { project: SupervisorDashboardProjectItem }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold leading-tight text-foreground">
            {project.title}
          </p>
          <p
            className="mt-1 text-sm leading-5 text-muted-foreground"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.summary ?? 'No summary provided yet.'}
          </p>
        </div>
        <Link
          to={`/supervisor/projects/${project.id}`}
          className={buttonStyles({
            variant: 'primary',
            size: 'sm',
            className: 'h-8 rounded-full px-3 text-xs font-bold',
          })}
        >
          Open
        </Link>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-slate-100 pt-3 text-xs">
        <div className="space-y-1">
          <dt className="font-medium uppercase tracking-wide text-slate-500">Status</dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(project.lifecycleStatus)}`}
            >
              {project.lifecycleStatus.replace('_', ' ')}
            </span>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-medium uppercase tracking-wide text-slate-500">Progress</dt>
          <dd className="text-base font-bold leading-none text-foreground">
            {project.progressPercent ?? 0}%
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-medium uppercase tracking-wide text-slate-500">Milestone</dt>
          <dd className="text-sm font-semibold text-foreground">
            {formatMilestoneDate(project.milestoneDate)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="font-medium uppercase tracking-wide text-slate-500">Jira Health</dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${jiraIndicatorClasses(project.jiraHealthIndicator)}`}
            >
              {jiraIndicatorLabel(project.jiraHealthIndicator)}
            </span>
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function SupervisorDashboardPage() {
  const { dashboard, isLoading, error, reload } = useSupervisorDashboard();
  const { showBlockingError, clearBlockingError } = useBlockingError();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const retryLoad = useCallback(() => {
    void reload();
  }, [reload]);
  const pageSize = 5;

  const projects = dashboard?.projects ?? [];
  const visibleProjects = projects.filter((project) =>
    normalizedQuery.length === 0
      ? true
      : `${project.title} ${project.summary ?? ''}`.toLowerCase().includes(normalizedQuery),
  );
  const totalPages = Math.max(1, Math.ceil(visibleProjects.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedProjects = visibleProjects.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery]);

  const now = new Date();
  const today = startOfDay(now);

  const attentionProjects: AttentionItem[] = projects
    .map((project) => {
      const reasons: string[] = [];
      let score = 0;

      const daysUntilMilestone = milestoneDeltaDays(project.milestoneDate, today);
      const inactivityDays = staleDays(project.lastActivityAt, now);

      if (project.lifecycleStatus === 'BEHIND') {
        score += 90;
        reasons.push('Lifecycle is marked behind.');
      } else if (project.lifecycleStatus === 'AT_RISK') {
        score += 70;
        reasons.push('Lifecycle is marked at risk.');
      }

      if (project.jiraHealthIndicator === 'BEHIND') {
        score += 50;
        reasons.push('Jira execution trend is behind.');
      } else if (project.jiraHealthIndicator === 'AT_RISK') {
        score += 35;
        reasons.push('Jira execution trend is at risk.');
      }

      if (daysUntilMilestone !== null) {
        if (daysUntilMilestone < 0) {
          score += 45 + Math.min(Math.abs(daysUntilMilestone), 20);
          reasons.push(`Milestone is ${Math.abs(daysUntilMilestone)} day(s) overdue.`);
        } else if (daysUntilMilestone <= 3) {
          score += 25;
          reasons.push('Milestone due within 3 days.');
        } else if (daysUntilMilestone <= UPCOMING_WINDOW_DAYS) {
          score += 12;
          reasons.push(`Milestone due within ${UPCOMING_WINDOW_DAYS} days.`);
        }
      }

      if (inactivityDays !== null) {
        if (inactivityDays >= 14) {
          score += 25;
          reasons.push(`No recent activity for ${inactivityDays} days.`);
        } else if (inactivityDays >= 7) {
          score += 12;
          reasons.push(`Limited activity in the last ${inactivityDays} days.`);
        }
      }

      if (
        daysUntilMilestone !== null &&
        daysUntilMilestone <= 7 &&
        (project.progressPercent ?? 0) < 40
      ) {
        score += 15;
        reasons.push('Progress is low for a near-term milestone.');
      }

      const severity: AttentionItem['severity'] =
        score >= 95 ||
        project.lifecycleStatus === 'BEHIND' ||
        project.jiraHealthIndicator === 'BEHIND' ||
        (daysUntilMilestone !== null && daysUntilMilestone < 0)
          ? 'critical'
          : 'warning';

      return {
        project,
        score,
        reasons: reasons.slice(0, 3),
        summaryText: attentionSummaryText(project, daysUntilMilestone),
        severity,
        daysUntilMilestone,
        inactivityDays,
      };
    })
    .filter((item) => item.score >= 45)
    .sort((left, right) => {
      if (left.severity !== right.severity) {
        return left.severity === 'critical' ? -1 : 1;
      }
      if (left.score !== right.score) {
        return right.score - left.score;
      }
      const leftDays = left.daysUntilMilestone ?? Number.POSITIVE_INFINITY;
      const rightDays = right.daysUntilMilestone ?? Number.POSITIVE_INFINITY;
      if (leftDays !== rightDays) {
        return leftDays - rightDays;
      }
      return (right.inactivityDays ?? -1) - (left.inactivityDays ?? -1);
    })
    .slice(0, ATTENTION_LIST_LIMIT);

  const upcomingProjects = projects
    .filter(
      (project) => Boolean(project.milestoneDate) && project.lifecycleStatus !== 'COMPLETED',
    )
    .map((project) => ({
      project,
      daysUntilMilestone: milestoneDeltaDays(project.milestoneDate, today),
    }))
    .filter(
      (
        item,
      ): item is {
        project: SupervisorDashboardProjectItem;
        daysUntilMilestone: number;
      } =>
        item.daysUntilMilestone !== null &&
        item.daysUntilMilestone >= -UPCOMING_WINDOW_DAYS &&
        item.daysUntilMilestone <= UPCOMING_WINDOW_DAYS,
    )
    .sort((left, right) => left.daysUntilMilestone - right.daysUntilMilestone)
    .slice(0, UPCOMING_LIST_LIMIT);

  useEffect(() => {
    if (error && isBlockingError(error)) {
      showBlockingError(error, retryLoad);
      return;
    }
    clearBlockingError();
  }, [error, showBlockingError, clearBlockingError, retryLoad]);

  if (error) {
    if (isBlockingError(error)) {
      return null;
    }
    return <ErrorState error={error} onRetry={() => void reload()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Dashboard"
        subtitle="Monitor delivery health across every supervised project."
        actions={
          <label className="relative block w-full min-w-0 max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search project"
              className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-amber-300"
            />
          </label>
        }
      />

      {isLoading || !dashboard ? (
        <DashboardStatsSkeleton />
      ) : (
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
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {dashboard.activeProjects}
            </p>
          </Card>
          <Card className="rounded-2xl" padding="md">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              At risk
            </p>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {dashboard.atRiskProjects}
            </p>
          </Card>
          <Card className="rounded-2xl" padding="md">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Behind
            </p>
            <p className="mt-3 text-3xl font-semibold text-foreground">
              {dashboard.behindProjects}
            </p>
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
            <p className="mt-3 text-3xl font-semibold text-amber-600">
              {dashboard.jiraAtRiskCount}
            </p>
          </Card>
          <Card className="rounded-2xl border-l-2 border-l-rose-300" padding="md">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Jira behind
            </p>
            <p className="mt-3 text-3xl font-semibold text-rose-600">{dashboard.jiraBehindCount}</p>
          </Card>
        </section>
      )}

      <section className="rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Project health</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Searchable overview with quick links into each project workspace.
            </p>
          </div>
          <Link
            to="/supervisor/projects"
            className={buttonStyles({ variant: 'ghost', size: 'md' })}
          >
            View all projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-5 space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`dashboard-row-skeleton-${index}`}
                className="h-16 rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : visibleProjects.length > 0 ? (
          <div className="mt-5 space-y-3">
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Project</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Milestone</th>
                    <th className="px-3 py-3">Progress</th>
                    <th className="px-3 py-3">Jira Health</th>
                    <th className="px-3 py-3">Quick links</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProjects.map((project) => (
                    <tr key={project.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-4 align-top">
                        <p className="font-medium text-foreground">{project.title}</p>
                        <p className="mt-1 max-w-md text-muted-foreground">
                          {project.summary ?? 'No summary provided yet.'}
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(project.lifecycleStatus)}`}
                        >
                          {project.lifecycleStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top text-muted-foreground">
                        {formatMilestoneDate(project.milestoneDate)}
                      </td>
                      <td className="px-3 py-4 align-top text-muted-foreground">
                        {project.progressPercent ?? 0}%
                      </td>
                      <td className="px-3 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${jiraIndicatorClasses(project.jiraHealthIndicator)}`}
                        >
                          {jiraIndicatorLabel(project.jiraHealthIndicator)}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <Link
                          to={`/supervisor/projects/${project.id}`}
                          className={buttonStyles({ variant: 'primary', size: 'sm' })}
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {pagedProjects.map((project) => (
                <ProjectHealthMobileCard key={project.id} project={project} />
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {(safeCurrentPage - 1) * pageSize + 1}-
                {Math.min(safeCurrentPage * pageSize, visibleProjects.length)} of{' '}
                {visibleProjects.length}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage <= 1}
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {safeCurrentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="No projects found"
              description="No supervised projects match your current filters."
            />
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Projects needing attention</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by lifecycle risk, Jira signal, milestone pressure, and recent activity.
          </p>
          {isLoading ? (
            <div className="mt-5 space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`attention-skeleton-${index}`}
                  className="h-20 rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : attentionProjects.length > 0 ? (
            <div className="mt-5 space-y-4">
              {attentionProjects.map((item) => {
                const toneClasses =
                  item.severity === 'critical'
                    ? 'border-rose-200 bg-rose-50/60'
                    : 'border-amber-200 bg-amber-50/60';
                const iconClasses =
                  item.severity === 'critical' ? 'text-rose-600' : 'text-amber-600';
                const signalPillClasses =
                  item.severity === 'critical'
                    ? 'border-rose-200 bg-rose-100 text-rose-700'
                    : 'border-amber-200 bg-amber-100 text-amber-700';
                return (
                  <div key={item.project.id} className={`rounded-2xl border p-4 ${toneClasses}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{item.project.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.summaryText}</p>
                      </div>
                      <AlertTriangle className={`mt-1 h-5 w-5 shrink-0 ${iconClasses}`} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${signalPillClasses}`}>
                        {item.severity === 'critical' ? 'Critical' : 'Needs review'}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {item.project.lifecycleStatus.replace('_', ' ')}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        Jira {jiraIndicatorLabel(item.project.jiraHealthIndicator)}
                      </span>
                      {item.daysUntilMilestone !== null ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {upcomingWindowLabel(item.daysUntilMilestone)}
                        </span>
                      ) : null}
                      {item.inactivityDays !== null ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {item.inactivityDays}d inactivity
                        </span>
                      ) : null}
                    </div>

                    {item.reasons.length > 0 ? (
                      <p className="mt-3 text-sm text-slate-600">{item.reasons.join(' ')}</p>
                    ) : null}

                    <div className="mt-3">
                      <Link
                        to={`/supervisor/projects/${item.project.id}`}
                        className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                      >
                        Open project
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No projects currently need urgent attention.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Upcoming milestones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Showing overdue items and milestones due within the next {UPCOMING_WINDOW_DAYS} days.
          </p>
          {isLoading ? (
            <div className="mt-5 space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`upcoming-skeleton-${index}`} className="h-16 rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : upcomingProjects.length > 0 ? (
            <div className="mt-5 space-y-4">
              {upcomingProjects.map((item) => (
                <div key={item.project.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-foreground sm:text-base">
                        {item.project.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatMilestoneDate(item.project.milestoneDate)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${upcomingWindowClasses(item.daysUntilMilestone)}`}
                    >
                      {upcomingWindowLabel(item.daysUntilMilestone)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
                      {item.project.lifecycleStatus.replace('_', ' ')}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
                      Jira {jiraIndicatorLabel(item.project.jiraHealthIndicator)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
                      {item.project.progressPercent ?? 0}% progress
                    </span>
                  </div>

                  <div className="mt-3">
                    <Link to={`/supervisor/projects/${item.project.id}`} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                      Review milestone
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No overdue or near-term milestones in the current window.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
