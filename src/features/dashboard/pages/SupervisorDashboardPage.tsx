import { useDeferredValue, useState } from 'react';
import { AlertTriangle, ArrowRight, FolderKanban, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSupervisorWorkspace } from '@/features/supervisor/hooks/useSupervisorWorkspace';

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
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-600">
              Supervisor Workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Monitor delivery health across every supervised project.
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              This dashboard follows the prototype supervision flow, but the implementation is
              adapted to the current frontend structure with reusable route modules and mock-backed
              UI states.
            </p>
          </div>

          <div className="w-full max-w-md">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search project or student"
                className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-amber-300"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Total projects
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Active
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.active}</p>
        </div>
        <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            At risk
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.atRisk}</p>
        </div>
        <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Behind
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.behind}</p>
        </div>
        <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Overdue actions
          </p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{stats.overdueActions}</p>
        </div>
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
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 transition-colors hover:text-amber-800"
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
                            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            Open
                          </Link>
                          <Link
                            to={`/supervisor/projects/${project.id}?tab=meetings`}
                            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50"
                          >
                            Meetings
                          </Link>
                          <Link
                            to={`/supervisor/projects/${project.id}?tab=files`}
                            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50"
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
          <div className="mt-5 rounded-3xl border border-dashed border-border bg-slate-50 p-10 text-center">
            <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              No projects match this search.
            </h3>
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
                    className="text-sm font-medium text-amber-700 transition-colors hover:text-amber-800"
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
