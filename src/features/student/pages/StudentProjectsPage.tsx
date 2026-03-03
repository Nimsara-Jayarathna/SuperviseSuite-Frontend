import { EmptyState } from '@/components/feedback/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StudentProjectCard } from '../components/StudentProjectCard';
import { useStudentProjects } from '../hooks/useStudentProjects';

export function StudentProjectsPage() {
  const { projects } = useStudentProjects();

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Projects"
        subtitle="Browse your assigned projects and open each workspace to review progress, meetings, action items, and files."
      />

      {projects.length > 0 ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {projects.map((project) => (
            <StudentProjectCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No projects assigned yet"
          description="When a supervisor assigns you to a project, it will appear here."
        />
      )}
    </div>
  );
}
