import { useDeferredValue, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StudentProjectCard } from '../components/StudentProjectCard';
import { useStudentProjects } from '../hooks/useStudentProjects';

export function StudentProjectsPage() {
  const { projects } = useStudentProjects();
  const [query, setQuery] = useState('');
  // Defer filtering slightly so the list stays responsive while typing.
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const visibleProjects = projects.filter((project) =>
    normalizedQuery.length === 0
      ? true
      : `${project.title} ${project.summary} ${project.teamMembers.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery),
  );

  // The empty state changes its action label depending on whether the user is filtering.
  const hasActiveFilters = normalizedQuery.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Projects"
        subtitle="Browse your assigned projects and open each workspace to review progress, meetings, action items, and files."
        actions={
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your projects"
            className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-slate-300 sm:w-64"
          />
        }
      />

      {visibleProjects.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
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
            onClick: hasActiveFilters ? () => setQuery('') : () => window.location.reload(),
          }}
        />
      )}
    </div>
  );
}
