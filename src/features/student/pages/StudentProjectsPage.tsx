import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { useBlockingError } from '@/app/layout/BlockingErrorContext';
import { ProjectsPageView } from '@/features/projects/components/ProjectsPageView';
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
    <ProjectsPageView
      title="My Projects"
      subtitle="Browse your assigned projects and open each workspace to review summary, team, and milestones."
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search your projects"
      isLoading={isLoading}
      error={error && !isBlockingError(error) ? error : null}
      onRetry={() => void reload()}
      items={visibleProjects}
      renderSkeleton={(index) => (
        <StudentProjectCardSkeleton key={`student-project-skeleton-${index}`} />
      )}
      renderItem={(project) => <StudentProjectCard key={project.id} project={project} />}
      listGridClassName="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3"
      emptyState={{
        title: 'No projects found',
        description: "You don't have any assigned projects matching your filters yet.",
        secondaryAction: {
          label: hasActiveFilters ? 'Clear filters' : 'Refresh',
          onClick: hasActiveFilters ? () => setQuery('') : () => void reload(),
        },
      }}
    />
  );
}
