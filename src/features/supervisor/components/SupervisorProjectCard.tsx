import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProjectCardFooter } from '@/components/ui/ProjectCardFooter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { SupervisorProjectSummary } from '../types';

type SupervisorProjectCardProps = {
  project: SupervisorProjectSummary;
};

function lifecycleTone(project: SupervisorProjectSummary) {
  if (project.lifecycleStatus === 'ACTIVE') return 'success';
  if (project.lifecycleStatus === 'AT_RISK') return 'warning';
  if (project.lifecycleStatus === 'BEHIND') return 'danger';
  if (project.lifecycleStatus === 'COMPLETED') return 'neutral';
  return 'student';
}

export function SupervisorProjectCard({ project }: SupervisorProjectCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md" padding="sm">
      <div className="grid min-h-[5.75rem] grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div className="min-w-0">
          <StatusBadge tone={lifecycleTone(project)} className="tracking-[0.08em]">
            {project.lifecycleStatus.replace('_', ' ')}
          </StatusBadge>
          <h2 className="mt-1 text-lg font-semibold text-foreground">{project.title}</h2>
          <p
            className="mt-0.5 overflow-hidden text-sm leading-[1.35rem] text-muted-foreground"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {project.summary ?? 'No summary provided yet.'}
          </p>
        </div>

        <div className="flex items-center">
          <p className="rounded-2xl bg-slate-50 px-2.5 py-1 text-sm font-semibold text-foreground">
            {project.progressPercent ?? 0}%
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="flex min-h-16 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Members
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-foreground">{project.memberCount}</p>
        </div>
        <div className="flex min-h-16 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Milestone
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-foreground">
            {project.milestoneDate ? project.milestoneDate : 'Not set'}
          </p>
        </div>
        <div className="flex min-h-16 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Batch
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-foreground">
            {project.batch ?? 'Not set'}
          </p>
        </div>
      </div>

      <div className="mt-3 min-h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Health note
        </p>
        <p
          className="mt-1 overflow-hidden text-xs leading-5 text-muted-foreground"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {project.healthNote ?? 'No health note recorded yet.'}
        </p>
      </div>

      <ProjectCardFooter
        primaryAction={
          <Link
            to={`/supervisor/projects/${project.id}`}
            className={buttonStyles({ variant: 'primary', size: 'md', className: 'w-full' })}
          >
            Open workspace
          </Link>
        }
      />
    </Card>
  );
}
