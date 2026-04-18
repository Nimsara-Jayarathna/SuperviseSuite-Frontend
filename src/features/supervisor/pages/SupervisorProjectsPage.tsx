import { useCallback, useDeferredValue, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useBlockingError } from '@/app/layout/BlockingErrorContext';
import { ProjectsPageView } from '@/features/projects/components/ProjectsPageView';
import { isBlockingError } from '@/utils/errorSeverity';
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
  const { showBlockingError, clearBlockingError } = useBlockingError();
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
  const retryLoad = useCallback(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (error && isBlockingError(error)) {
      showBlockingError(error, retryLoad);
      return;
    }
    clearBlockingError();
  }, [error, showBlockingError, clearBlockingError, retryLoad]);

  return (
    <ProjectsPageView
      title="Projects"
      subtitle="Review every supervised project in one place."
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search by project title, summary, batch, or semester"
      action={{
        to: '/supervisor/projects/new',
        label: 'New Project',
        icon: <Plus className="h-4 w-4" aria-hidden />,
      }}
      filter={{
        value: lifecycle,
        onChange: (nextValue) => setLifecycle(nextValue as LifecycleFilter),
        options: LIFECYCLE_OPTIONS.map((option) => ({
          value: option,
          label: option === 'ALL' ? 'All lifecycle states' : option.replace('_', ' '),
        })),
      }}
      isLoading={isLoading}
      error={error && !isBlockingError(error) ? error : null}
      onRetry={() => void reload()}
      items={visibleProjects}
      renderSkeleton={(index) => (
        <SupervisorProjectCardSkeleton key={`supervisor-project-skeleton-${index}`} />
      )}
      renderItem={(project) => <SupervisorProjectCard key={project.id} project={project} />}
      listGridClassName="grid items-stretch gap-2.5 lg:gap-3 xl:grid-cols-2 2xl:grid-cols-3"
      emptyState={{
        title: 'No projects found',
        description: 'No supervised projects match your current filters.',
        primaryAction: {
          label: 'Create new project',
          onClick: () => navigate('/supervisor/projects/new'),
        },
        secondaryAction: hasActiveFilters
          ? {
              label: 'Clear filters',
              onClick: resetFilters,
            }
          : undefined,
      }}
      rootClassName="space-y-5"
    />
  );
}
