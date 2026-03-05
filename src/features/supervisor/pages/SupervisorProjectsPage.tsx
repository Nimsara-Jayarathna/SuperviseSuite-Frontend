import { useDeferredValue, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SupervisorProjectCard } from '../components/SupervisorProjectCard';
import { SupervisorProjectCardSkeleton } from '../components/SupervisorProjectCardSkeleton';
import { useSupervisorProjects } from '../hooks/useSupervisorProjects';
import type { SupervisorProjectLifecycle } from '../types';

type LifecycleFilter = 'ALL' | SupervisorProjectLifecycle;

const LIFECYCLE_OPTIONS: LifecycleFilter[] = [
  'ALL',
  'PLANNING',
  'ACTIVE',
  'AT_RISK',
  'BEHIND',
  'COMPLETED',
];

export function SupervisorProjectsPage() {
  const navigate = useNavigate();
  const { projects, isLoading, error, reload } = useSupervisorProjects();
  const [query, setQuery] = useState('');
  const [lifecycle, setLifecycle] = useState<LifecycleFilter>('ALL');
  // Defer the free-text query so large list filtering does not run on every keystroke.
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const visibleProjects = projects.filter((project) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${project.title} ${project.summary ?? ''} ${project.batch ?? ''} ${project.semester ?? ''}`
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesLifecycle = lifecycle === 'ALL' || project.lifecycleStatus === lifecycle;

    return matchesQuery && matchesLifecycle;
  });

  // Reset returns the page to the default "all projects" state used by the route.
  const resetFilters = () => {
    setQuery('');
    setLifecycle('ALL');
  };
  const hasActiveFilters = normalizedQuery.length > 0 || lifecycle !== 'ALL';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        subtitle="Review every supervised project in one place."
        actions={
          <Link
            to="/supervisor/projects/new"
            className={buttonStyles({ variant: 'primary', size: 'md' })}
          >
            New project
          </Link>
        }
      />

      <section className="grid gap-2.5 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_210px] lg:gap-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by project title, summary, batch, or semester"
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
      </section>

      {isLoading ? (
        <section className="grid items-stretch gap-2.5 lg:gap-3 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SupervisorProjectCardSkeleton key={`supervisor-project-skeleton-${index}`} />
          ))}
        </section>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void reload()} />
      ) : visibleProjects.length > 0 ? (
        <section className="grid items-stretch gap-2.5 lg:gap-3 xl:grid-cols-2">
          {visibleProjects.map((project) => (
            <SupervisorProjectCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No projects found"
          description="No supervised projects match your current filters."
          primaryAction={{
            label: 'Create new project',
            onClick: () => navigate('/supervisor/projects/new'),
          }}
          secondaryAction={
            hasActiveFilters
              ? {
                  label: 'Clear filters',
                  onClick: resetFilters,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
