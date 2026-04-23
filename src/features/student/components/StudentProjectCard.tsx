import { CalendarDays, CircleAlert, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { parseLocalDateOnly } from '@/lib/dateOnly';
import type { StudentProjectSummary } from '../types';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

type StudentProjectCardProps = {
  project: StudentProjectSummary;
};

function statusTone(status: StudentProjectSummary['status']) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'AT_RISK') return 'warning';
  if (status === 'BEHIND') return 'danger';
  if (status === 'COMPLETED') return 'neutral';
  return 'student';
}

export function StudentProjectCard({ project }: StudentProjectCardProps) {
  const progressValue =
    typeof project.progressPercent === 'number' ? `${project.progressPercent}%` : '-';
  const title = project.title;
  const summary = project.summary ?? 'No summary has been added yet.';
  const supervisorName = project.supervisorName ?? 'Not available';

  return (
    <Link
      to={`/student/projects/${project.id}`}
      className="group flex h-full flex-col rounded-3xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-200"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <h3 className="truncate text-lg font-semibold text-foreground" title={title}>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <StatusBadge tone={statusTone(project.status)} className="tracking-[0.08em]">
            {project.status.replace('_', ' ')}
          </StatusBadge>
          <span className="inline-flex rounded-2xl bg-slate-50 px-2.5 py-1 text-sm font-semibold text-foreground">
            {progressValue}
          </span>
        </div>
      </div>

      <p
        className="mt-1.5 overflow-hidden text-sm leading-[1.35rem] text-muted-foreground"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
        title={summary}
      >
        {summary}
      </p>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
        <div className="flex min-h-14 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Supervisor
          </p>
          <p
            className="mt-0.5 truncate text-[15px] font-semibold text-foreground"
            title={supervisorName}
          >
            {supervisorName}
          </p>
        </div>
        <div className="flex min-h-14 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Batch
          </p>
          <p
            className="mt-0.5 truncate text-[15px] font-semibold text-foreground"
            title={project.batch ?? 'Batch N/A'}
          >
            {project.batch ?? 'Batch N/A'}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
          <CalendarDays className="h-4 w-4" />
          {project.milestoneDate
            ? (() => {
                const milestoneDate = parseLocalDateOnly(project.milestoneDate);
                return `Milestone ${
                  milestoneDate ? dateFormatter.format(milestoneDate) : project.milestoneDate
                }`;
              })()
            : 'Milestone not set'}
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
          <ListTodo className="h-4 w-4" />
          {project.batch ?? 'Batch N/A'}
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
          <CircleAlert className="h-4 w-4" />
          {project.lastActivityAt
            ? `Updated ${dateFormatter.format(new Date(project.lastActivityAt))}`
            : 'No activity yet'}
        </span>
      </div>
    </Link>
  );
}
