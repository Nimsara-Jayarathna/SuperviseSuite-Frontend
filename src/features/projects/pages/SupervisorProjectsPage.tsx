import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupervisorWorkspace } from '@/features/supervisor/hooks/useSupervisorWorkspace';
import type { SupervisorProjectLifecycle } from '@/features/supervisor/types';

type LifecycleFilter = 'ALL' | SupervisorProjectLifecycle;
type IntegrationFilter = 'ALL' | 'CONNECTED' | 'ISSUES';

const LIFECYCLE_OPTIONS: LifecycleFilter[] = [
  'ALL',
  'PLANNING',
  'ACTIVE',
  'AT_RISK',
  'BEHIND',
  'COMPLETED',
];

function badgeClasses(lifecycle: SupervisorProjectLifecycle) {
  if (lifecycle === 'ACTIVE') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (lifecycle === 'AT_RISK') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (lifecycle === 'BEHIND') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (lifecycle === 'COMPLETED') return 'border-slate-300 bg-slate-100 text-slate-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
}

export function SupervisorProjectsPage() {
  const { projects } = useSupervisorWorkspace();
  const [query, setQuery] = useState('');
  const [lifecycle, setLifecycle] = useState<LifecycleFilter>('ALL');
  const [integration, setIntegration] = useState<IntegrationFilter>('ALL');
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const visibleProjects = projects.filter((project) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${project.title} ${project.summary} ${project.members.map((member) => member.name).join(' ')}`
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesLifecycle = lifecycle === 'ALL' || project.lifecycle === lifecycle;
    const matchesIntegration =
      integration === 'ALL' ||
      (integration === 'CONNECTED' &&
        project.integrations.every((item) => item.status === 'Connected')) ||
      (integration === 'ISSUES' && project.integrations.some((item) => item.status === 'Issue'));

    return matchesQuery && matchesLifecycle && matchesIntegration;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-600">
              Projects
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Review every supervised project in one place.
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              This page keeps the prototype project list behavior, but it is reworked into the
              current frontend’s card-based layout and feature structure.
            </p>
          </div>

          <Link
            to="/supervisor/projects/new"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            New project
          </Link>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by project title or member"
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
          />
          <select
            value={lifecycle}
            onChange={(event) => setLifecycle(event.target.value as LifecycleFilter)}
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
          >
            {LIFECYCLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All lifecycle states' : option.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={integration}
            onChange={(event) => setIntegration(event.target.value as IntegrationFilter)}
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
          >
            <option value="ALL">All integrations</option>
            <option value="CONNECTED">Fully connected</option>
            <option value="ISSUES">Has integration issues</option>
          </select>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {visibleProjects.map((project) => {
          const openActionCount = project.actionItems.filter(
            (item) => item.status !== 'Done',
          ).length;
          const issueCount = project.integrations.filter(
            (item) => item.status !== 'Connected',
          ).length;

          return (
            <div
              key={project.id}
              className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses(project.lifecycle)}`}
                  >
                    {project.lifecycle.replace('_', ' ')}
                  </span>
                  <h2 className="mt-3 text-xl font-semibold text-foreground">{project.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{project.summary}</p>
                </div>
                <p className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-foreground">
                  {project.progress}%
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Members
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {project.members.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Open actions
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{openActionCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Integration flags
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{issueCount}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {project.members.map((member) => (
                  <span
                    key={`${project.id}-${member.id}`}
                    className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    {member.name}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/supervisor/projects/${project.id}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Open workspace
                </Link>
                <Link
                  to={`/supervisor/projects/${project.id}?tab=action-items`}
                  className="inline-flex items-center justify-center rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-slate-50"
                >
                  Action items
                </Link>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
