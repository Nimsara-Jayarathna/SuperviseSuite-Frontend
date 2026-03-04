import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProjectCardFooter } from '@/components/ui/ProjectCardFooter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { SupervisorProject } from '../types';

type SupervisorProjectCardProps = {
  project: SupervisorProject;
};

function lifecycleTone(project: SupervisorProject) {
  if (project.lifecycle === 'ACTIVE') return 'success';
  if (project.lifecycle === 'AT_RISK') return 'warning';
  if (project.lifecycle === 'BEHIND') return 'danger';
  if (project.lifecycle === 'COMPLETED') return 'neutral';
  return 'student';
}

export function SupervisorProjectCard({ project }: SupervisorProjectCardProps) {
  const openActionCount = project.actionItems.filter((item) => item.status !== 'Done').length;
  const issueCount = project.integrations.filter((item) => item.status !== 'Connected').length;
  const visibleMembers = project.members.slice(0, 3);
  const overflowCount = Math.max(0, project.members.length - visibleMembers.length);

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md" padding="sm">
      <div className="grid min-h-[5.75rem] grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div className="min-w-0">
          <StatusBadge tone={lifecycleTone(project)} className="tracking-[0.08em]">
            {project.lifecycle.replace('_', ' ')}
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
            {project.summary}
          </p>
        </div>

        <div className="flex items-center">
          <p className="rounded-2xl bg-slate-50 px-2.5 py-1 text-sm font-semibold text-foreground">
            {project.progress}%
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="flex min-h-16 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Members
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-foreground">
            {project.members.length}
          </p>
        </div>
        <div className="flex min-h-16 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Open Actions
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-foreground">{openActionCount}</p>
        </div>
        <div className="flex min-h-16 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Integration Flags
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-foreground">{issueCount}</p>
        </div>
      </div>

      <div className="mt-3 min-h-10 max-h-10 overflow-hidden">
        <div className="flex flex-wrap gap-1.5">
          {visibleMembers.map((member) => (
            <span
              key={`${project.id}-${member.id}`}
              className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-foreground"
            >
              {member.name}
            </span>
          ))}
          {overflowCount > 0 ? (
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              +{overflowCount}
            </span>
          ) : null}
        </div>
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
        secondaryAction={
          <Link
            to={`/supervisor/projects/${project.id}?tab=action-items`}
            className={buttonStyles({ variant: 'secondary', size: 'md', className: 'w-full' })}
          >
            Action items
          </Link>
        }
      />
    </Card>
  );
}
