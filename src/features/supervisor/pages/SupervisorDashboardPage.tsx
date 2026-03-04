import { useDeferredValue, useState } from 'react';
import { AlertTriangle, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/feedback/EmptyState';
import { buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useSupervisorWorkspace } from '../hooks/useSupervisorWorkspace';

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

export function SupervisorDashboardPage() {
  const { projects, stats } = useSupervisorWorkspace();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const visibleProjects = projects.filter((project) =>
    normalizedQuery.length === 0
      ? true
      : `${project.title} ${project.summary} ${project.members.map((member) => member.name).join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery),
  );

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
              placeholder="Search project or student"
              className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-amber-300"
            />
          </label>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="rounded-2xl" padding="md">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Total projects
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.total}</p>
        </Card>
        <Card className="rounded-2xl" padding="md">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Active
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.active}</p>
        </Card>
        <Card className="rounded-2xl" padding="md">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            At risk
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.atRisk}</p>
        </Card>
        <Card className="rounded-2xl" padding="md">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Behind
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.behind}</p>
        </Card>
        <Card className="rounded-2xl" padding="md">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Overdue actions
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.overdueActions}</p>
        </Card>
      </section>

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

        {visibleProjects.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Project</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Milestone</th>
                  <th className="px-3 py-3">Open actions</th>
                  <th className="px-3 py-3">Quick links</th>
                </tr>
              </thead>
              <tbody>
                {visibleProjects.map((project) => {
                  const openActionCount = project.actionItems.filter(
                    (item) => item.status !== 'Done',
                  ).length;

                  return (
                    <tr key={project.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-4 align-top">
                        <p className="font-medium text-foreground">{project.title}</p>
                        <p className="mt-1 max-w-md text-muted-foreground">{project.summary}</p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(project.lifecycle)}`}
                        >
                          {project.lifecycle.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top text-muted-foreground">
                        {dateFormatter.format(new Date(project.milestoneDate))}
                      </td>
                      <td className="px-3 py-4 align-top text-muted-foreground">
                        {openActionCount}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/supervisor/projects/${project.id}`}
                            className={buttonStyles({ variant: 'primary', size: 'sm' })}
                          >
                            Open
                          </Link>
                          <Link
                            to={`/supervisor/projects/${project.id}?tab=meetings`}
                            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                          >
                            Meetings
                          </Link>
                          <Link
                            to={`/supervisor/projects/${project.id}?tab=files`}
                            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                          >
                            Files
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          <div className="mt-5 space-y-4">
            {projects
              .filter(
                (project) => project.lifecycle === 'AT_RISK' || project.lifecycle === 'BEHIND',
              )
              .map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{project.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {project.healthNote}
                      </p>
                    </div>
                    <AlertTriangle className="mt-1 h-5 w-5 text-amber-600" />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Upcoming milestones</h2>
          <div className="mt-5 space-y-4">
            {[...projects]
              .sort((a, b) => a.milestoneDate.localeCompare(b.milestoneDate))
              .slice(0, 4)
              .map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{project.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dateFormatter.format(new Date(project.milestoneDate))}
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
        </div>
      </section>
    </div>
  );
}
