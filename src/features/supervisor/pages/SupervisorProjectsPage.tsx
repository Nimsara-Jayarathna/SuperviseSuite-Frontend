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

      <section className="grid items-stretch gap-3 xl:grid-cols-2">
        {visibleProjects.map((project) => (
          <SupervisorProjectCard key={project.id} project={project} />
        ))}
      </section>
    </div>
  );
}
