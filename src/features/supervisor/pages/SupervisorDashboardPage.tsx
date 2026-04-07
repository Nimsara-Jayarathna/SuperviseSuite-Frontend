import { useDeferredValue, useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSupervisorDashboard } from '../hooks/useSupervisorDashboard';
import type { SupervisorDashboardProjectItem } from '../types';

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
  return '—';
}

function formatMilestoneDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : 'Not set';
}

function DashboardStatsSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
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

export function SupervisorDashboardPage() {
  const { dashboard, isLoading, error, reload } = useSupervisorDashboard();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
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

  const attentionProjects = projects.filter(
    (project) => project.lifecycleStatus === 'AT_RISK' || project.lifecycleStatus === 'BEHIND',
  );
  const upcomingProjects = [...projects]
    .filter((project) => Boolean(project.milestoneDate))
    .sort((a, b) => {
      const left = a.milestoneDate ?? '';
      const right = b.milestoneDate ?? '';
      return left.localeCompare(right);
    })
    .slice(0, 4);

  if (error) {
    return <ErrorState error={error} onRetry={() => void reload()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Dashboard"
        subtitle="Monitor delivery health across every supervised project."
        actions={
          <label className="relative block w-full max-w-md">
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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
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

      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
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
            <div className="overflow-x-auto">
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
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {(safeCurrentPage - 1) * pageSize + 1}-
                {Math.min(safeCurrentPage * pageSize, visibleProjects.length)} of{' '}
                {visibleProjects.length}
              </p>
              <div className="flex items-center gap-2">
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
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Projects needing attention</h2>
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
              {attentionProjects.map((project: SupervisorDashboardProjectItem) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{project.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {project.healthNote ?? 'No health note recorded yet.'}
                      </p>
                    </div>
                    <AlertTriangle className="mt-1 h-5 w-5 text-amber-600" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No projects currently need urgent attention.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Upcoming milestones</h2>
          {isLoading ? (
            <div className="mt-5 space-y-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`upcoming-skeleton-${index}`} className="h-16 rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : upcomingProjects.length > 0 ? (
            <div className="mt-5 space-y-4">
              {upcomingProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{project.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatMilestoneDate(project.milestoneDate)}
                    </p>
                  </div>
                  <Link
                    to={`/supervisor/projects/${project.id}`}
                    className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No upcoming milestones in the current window.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
