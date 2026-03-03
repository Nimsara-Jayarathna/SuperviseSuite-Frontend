import { ArrowUpRight, CalendarDays, CircleAlert, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import type { StudentProject } from '../types';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const STATUS_STYLES: Record<StudentProject['status'], string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  AT_RISK: 'border-amber-200 bg-amber-50 text-amber-700',
  PLANNING: 'border-sky-200 bg-sky-50 text-sky-700',
};

type StudentProjectCardProps = {
  project: StudentProject;
};

export function StudentProjectCard({ project }: StudentProjectCardProps) {
  const progressMetric = project.metrics.find((metric) => metric.label === 'Progress');
  const actionsMetric = project.metrics.find((metric) => metric.label === 'Open actions');

  return (
    <Link
      to={`/student/projects/${project.id}`}
      className="group block rounded-3xl border border-border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <span
            className={cn(
              'inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
              STATUS_STYLES[project.status],
            )}
          >
            {project.status.replace('_', ' ')}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{project.summary}</p>
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Progress
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {progressMetric?.value ?? '-'}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Team
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {project.teamMembers.length} members
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Milestone {dateFormatter.format(new Date(project.milestoneDate))}
        </span>
        <span className="inline-flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          {actionsMetric?.value ?? '0'} open actions
        </span>
        <span className="inline-flex items-center gap-2">
          <CircleAlert className="h-4 w-4" />
          Updated {dateFormatter.format(new Date(project.lastUpdatedAt))}
        </span>
      </div>
    </Link>
  );
}
