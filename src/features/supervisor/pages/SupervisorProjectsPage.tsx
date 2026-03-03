import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { SupervisorProjectCard } from '../components/SupervisorProjectCard';
import { useSupervisorWorkspace } from '../hooks/useSupervisorWorkspace';
import type { SupervisorProjectLifecycle } from '../types';

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
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        subtitle="Review every supervised project in one place."
        actions={
          <div className="lg:pt-1">
            <Link
              to="/supervisor/projects/new"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              New project
            </Link>
          </div>
        }
      />

      <section className="grid gap-2.5 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_210px_210px] lg:gap-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by project title or member"
          className="h-10 rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
        />
        <select
          value={lifecycle}
          onChange={(event) => setLifecycle(event.target.value as LifecycleFilter)}
          className="h-10 rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
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
          className="h-10 rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
        >
          <option value="ALL">All integrations</option>
          <option value="CONNECTED">Fully connected</option>
          <option value="ISSUES">Has integration issues</option>
        </select>
      </section>

      <section className="grid items-stretch gap-2.5 lg:gap-3 xl:grid-cols-2">
        {visibleProjects.map((project) => (
          <SupervisorProjectCard key={project.id} project={project} />
        ))}
      </section>
    </div>
  );
}
