import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { useBlockingError } from '@/app/layout/BlockingErrorContext';
import { isBlockingError } from '@/utils/errorSeverity';
import { StudentProjectCard } from '../components/StudentProjectCard';
import { StudentProjectCardSkeleton } from '../components/StudentProjectCardSkeleton';
import { useStudentProjects } from '../hooks/useStudentProjects';

export function StudentProjectsPage() {
  const { projects, isLoading, error, reload } = useStudentProjects();
  const { showBlockingError, clearBlockingError } = useBlockingError();
  const [query, setQuery] = useState('');
  // Defer filtering slightly so the list stays responsive while typing.
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const retryLoad = useCallback(() => {
    void reload();
  }, [reload]);

  const visibleProjects = projects.filter((project) =>
    normalizedQuery.length === 0
      ? true
      : `${project.title} ${project.summary ?? ''} ${project.supervisorName ?? ''} ${project.batch ?? ''} ${project.semester ?? ''}`
          .toLowerCase()
          .includes(normalizedQuery),
  );

  // The empty state changes its action label depending on whether the user is filtering.
  const hasActiveFilters = normalizedQuery.length > 0;

  useEffect(() => {
    if (error && isBlockingError(error)) {
      showBlockingError(error, retryLoad);
      return;
    }
    clearBlockingError();
  }, [error, showBlockingError, clearBlockingError, retryLoad]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Projects"
        subtitle="Browse your assigned projects and open each workspace to review summary, team, and milestones."
        actions={
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your projects"
            className="h-10 w-full min-w-0 rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-slate-300 sm:w-64"
          />
        }
      />

      {isLoading ? (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <StudentProjectCardSkeleton key={`student-project-skeleton-${index}`} />
          ))}
        </section>
      ) : error && !isBlockingError(error) ? (
        <ErrorState error={error} onRetry={() => void reload()} />
      ) : visibleProjects.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleProjects.map((project) => (
            <StudentProjectCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No projects found"
          description="You don’t have any assigned projects matching your filters yet."
          secondaryAction={{
            label: hasActiveFilters ? 'Clear filters' : 'Refresh',
            onClick: hasActiveFilters ? () => setQuery('') : () => void reload(),
          }}
        />
      )}
    </div>
  );
}
