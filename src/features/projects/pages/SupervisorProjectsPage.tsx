import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
      <PageHeader
        title="Projects"
        subtitle="Review every supervised project in one place."
        actions={
          <Link
            to="/supervisor/projects/new"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            New project
          </Link>
        }
      />

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
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
                  <StatusBadge
                    tone={
                      project.lifecycle === 'ACTIVE'
                        ? 'success'
                        : project.lifecycle === 'AT_RISK'
                          ? 'warning'
                          : project.lifecycle === 'BEHIND'
                            ? 'danger'
                            : project.lifecycle === 'COMPLETED'
                              ? 'neutral'
                              : 'student'
                    }
                    className="tracking-[0.08em]"
                  >
                    {project.lifecycle.replace('_', ' ')}
                  </StatusBadge>
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
