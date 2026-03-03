import { FolderKanban } from 'lucide-react';
import { StudentProjectCard } from '../components/StudentProjectCard';
import { useStudentProjects } from '../hooks/useStudentProjects';

export function StudentProjectsPage() {
  const { projects } = useStudentProjects();

  return (
    <div className="space-y-8">
      {projects.length > 0 ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {projects.map((project) => (
            <StudentProjectCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No projects available.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Assigned projects will appear here once the workspace is populated.
          </p>
        </section>
      )}
    </div>
  );
}
