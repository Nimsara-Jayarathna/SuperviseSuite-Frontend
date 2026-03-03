import { Link } from 'react-router-dom';
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
    <article className="flex h-full flex-col rounded-3xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="grid min-h-[7.5rem] grid-cols-[minmax(0,1fr)_auto] gap-3">
        <div className="min-w-0">
          <StatusBadge tone={lifecycleTone(project)} className="tracking-[0.08em]">
            {project.lifecycle.replace('_', ' ')}
          </StatusBadge>
          <h2 className="mt-2 text-lg font-semibold text-foreground">{project.title}</h2>
          <p
            className="mt-1 overflow-hidden text-sm leading-6 text-muted-foreground"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {project.summary}
          </p>
        </div>

        <div className="flex items-start">
          <p className="rounded-2xl bg-slate-50 px-3 py-1.5 text-sm font-semibold text-foreground">
            {project.progress}%
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="flex min-h-[4.75rem] flex-col justify-center rounded-2xl bg-slate-50 px-3 py-2.5">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Members
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{project.members.length}</p>
        </div>
        <div className="flex min-h-[4.75rem] flex-col justify-center rounded-2xl bg-slate-50 px-3 py-2.5">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Open Actions
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{openActionCount}</p>
        </div>
        <div className="flex min-h-[4.75rem] flex-col justify-center rounded-2xl bg-slate-50 px-3 py-2.5">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Integration Flags
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{issueCount}</p>
        </div>
      </div>

      <div className="mt-4 min-h-[3.25rem]">
        <div className="flex flex-wrap gap-1.5 overflow-hidden">
          {visibleMembers.map((member) => (
            <span
              key={`${project.id}-${member.id}`}
              className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-foreground"
            >
              {member.name}
            </span>
          ))}
          {overflowCount > 0 ? (
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              +{overflowCount}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/supervisor/projects/${project.id}`}
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Open workspace
        </Link>
        <Link
          to={`/supervisor/projects/${project.id}?tab=action-items`}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-slate-50"
        >
          Action items
        </Link>
      </div>
    </article>
  );
}
