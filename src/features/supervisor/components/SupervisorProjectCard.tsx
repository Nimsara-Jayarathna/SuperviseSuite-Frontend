import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { diffDaysDateOnly } from '@/lib/dateOnly';
import type { SupervisorProjectSummary } from '../types';

type SupervisorProjectCardProps = {
  project: SupervisorProjectSummary;
};

function deriveSignalSummary(project: SupervisorProjectSummary): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (project.milestoneDate) {
    const daysUntil = diffDaysDateOnly(project.milestoneDate, today);
    if (daysUntil !== null && daysUntil < 0) {
      const overdueDays = Math.abs(daysUntil);
      return overdueDays === 1
        ? 'Primary milestone is overdue by 1 day and needs recovery action.'
        : `Primary milestone is overdue by ${overdueDays} days and needs recovery action.`;
    }
  }

  if (project.lifecycleStatus === 'BEHIND') {
    return 'Lifecycle is behind. Prioritize blocker removal and milestone recovery.';
  }
  if (project.lifecycleStatus === 'AT_RISK') {
    return 'Lifecycle is at risk. Tighten near-term scope and confirm milestone owners.';
  }

  if (project.milestoneDate) {
    const daysUntil = diffDaysDateOnly(project.milestoneDate, today);
    if (daysUntil !== null && daysUntil <= 7) {
      return `Milestone due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}. Validate readiness this week.`;
    }
  }

  return 'Delivery signals are stable. Keep milestones and execution updates current.';
}

function lifecycleTone(project: SupervisorProjectSummary) {
  if (project.lifecycleStatus === 'ACTIVE') return 'success';
  if (project.lifecycleStatus === 'AT_RISK') return 'warning';
  if (project.lifecycleStatus === 'BEHIND') return 'danger';
  if (project.lifecycleStatus === 'COMPLETED') return 'neutral';
  return 'student';
}

export function SupervisorProjectCard({ project }: SupervisorProjectCardProps) {
  const title = project.title;
  const summary = project.summary ?? 'No summary provided yet.';
  const batch = project.batch ?? 'Not set';
  const signalSummary = deriveSignalSummary(project);

  return (
    <Link
      to={`/supervisor/projects/${project.id}`}
      className="group flex h-full flex-col rounded-3xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-200"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <h2 className="truncate text-lg font-semibold text-foreground" title={title}>
          {title}
        </h2>

        <div className="flex items-center gap-2">
          <StatusBadge tone={lifecycleTone(project)} className="tracking-[0.08em]">
            {project.lifecycleStatus.replace('_', ' ')}
          </StatusBadge>
          <p className="rounded-2xl bg-slate-50 px-2.5 py-1 text-sm font-semibold text-foreground">
            {project.progressPercent ?? 0}%
          </p>
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

      <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
        <div className="flex min-h-14 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Members
          </p>
          <p className="mt-0.5 truncate text-[15px] font-semibold text-foreground">
            {project.memberCount}
          </p>
        </div>
        <div className="flex min-h-14 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Milestone
          </p>
          <p
            className="mt-0.5 truncate text-[15px] font-semibold text-foreground"
            title={project.milestoneDate ?? 'Not set'}
          >
            {project.milestoneDate ? project.milestoneDate : 'Not set'}
          </p>
        </div>
        <div className="flex min-h-14 flex-col justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Batch
          </p>
          <p className="mt-0.5 truncate text-[15px] font-semibold text-foreground" title={batch}>
            {batch}
          </p>
        </div>
      </div>

      <div className="mt-2.5 min-h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Delivery signal
        </p>
        <p
          className="mt-1 overflow-hidden text-xs leading-5 text-muted-foreground"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          title={signalSummary}
        >
          {signalSummary}
        </p>
      </div>
    </Link>
  );
}
