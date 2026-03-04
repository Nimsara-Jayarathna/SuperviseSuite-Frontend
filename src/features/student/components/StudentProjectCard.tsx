import { CalendarDays, CircleAlert, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProjectCardFooter } from '@/components/ui/ProjectCardFooter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { StudentProject } from '../types';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

type StudentProjectCardProps = {
  project: StudentProject;
};

function statusTone(status: StudentProject['status']) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'AT_RISK') return 'warning';
  return 'student';
}

export function StudentProjectCard({ project }: StudentProjectCardProps) {
  const progressMetric = project.metrics.find((metric) => metric.label === 'Progress');
  const actionsMetric = project.metrics.find((metric) => metric.label === 'Open actions');

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md" padding="sm">
      <div className="grid min-h-[5.75rem] grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div className="min-w-0">
          <StatusBadge tone={statusTone(project.status)} className="tracking-[0.08em]">
            {project.status.replace('_', ' ')}
          </StatusBadge>
          <h3 className="mt-1 text-lg font-semibold text-foreground">{project.title}</h3>
          <p
            className="mt-0.5 overflow-hidden text-sm leading-[1.35rem] text-muted-foreground"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {project.summary}
          </p>
        </div>
        <span className="inline-flex h-fit rounded-2xl bg-slate-50 px-2.5 py-1 text-sm font-semibold text-foreground">
          {progressMetric?.value ?? '-'}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="flex min-h-16 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Progress
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-foreground">
            {progressMetric?.value ?? '-'}
          </p>
        </div>
        <div className="flex min-h-16 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Team
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-foreground">
            {project.teamMembers.length} members
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
          <CalendarDays className="h-4 w-4" />
          Milestone {dateFormatter.format(new Date(project.milestoneDate))}
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
          <ListTodo className="h-4 w-4" />
          {actionsMetric?.value ?? '0'} open actions
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
          <CircleAlert className="h-4 w-4" />
          Updated {dateFormatter.format(new Date(project.lastUpdatedAt))}
        </span>
      </div>

      <ProjectCardFooter
        primaryAction={
          <Link
            to={`/student/projects/${project.id}`}
            className={buttonStyles({ variant: 'primary', size: 'md', className: 'w-full' })}
          >
            Open workspace
          </Link>
        }
        secondaryAction={
          <Link
            to={`/student/projects/${project.id}?tab=action-items`}
            className={buttonStyles({ variant: 'secondary', size: 'md', className: 'w-full' })}
          >
            Action items
          </Link>
        }
      />
    </Card>
  );
}
