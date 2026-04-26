import { CalendarDays, Clock3, Users } from 'lucide-react';
import { useRef } from 'react';
import { Select } from '@/components/ui/Select';
import { parseLocalDateOnly } from '@/lib/dateOnly';
import { dateFormatter, LIFECYCLE_OPTIONS } from '../../projectDetails.shared';
import type { SupervisorProjectLifecycle } from '../../types';

type SupervisorProjectDetailsHeaderProps = {
  title: string;
  summary: string | null;
  milestoneDate: string | null;
  membersCount: number;
  progressPercent: number | null;
  quickLifecycleStatus: SupervisorProjectLifecycle;
  isUpdatingStatus: boolean;
  onQuickStatusChange: (status: SupervisorProjectLifecycle) => void;
};

export function SupervisorProjectDetailsHeader({
  title,
  summary,
  milestoneDate,
  membersCount,
  progressPercent,
  quickLifecycleStatus,
  isUpdatingStatus,
  onQuickStatusChange,
}: SupervisorProjectDetailsHeaderProps) {
  const parsedMilestoneDate = milestoneDate ? parseLocalDateOnly(milestoneDate) : null;
  const lifecyclePillRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <section className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          <p
            className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {summary ?? 'No summary has been recorded for this project yet.'}
          </p>
        </div>
        <div
          ref={lifecyclePillRef}
          className="inline-flex shrink-0 items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:border-amber-200 hover:shadow-md"
        >
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Lifecycle
            </span>
            <div className="mt-0.5">
              <Select
                value={quickLifecycleStatus}
                onChange={(e) => onQuickStatusChange(e.target.value as SupervisorProjectLifecycle)}
                disabled={isUpdatingStatus}
                menuAnchorRef={lifecyclePillRef}
                menuAlign="auto"
                menuMatchTriggerWidth
                className="bg-transparent text-[13px] font-black uppercase tracking-tight text-foreground outline-none cursor-pointer"
              >
                {LIFECYCLE_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Milestone
              </span>
              <span className="font-semibold text-slate-700">
                {milestoneDate
                  ? parsedMilestoneDate
                    ? dateFormatter.format(parsedMilestoneDate)
                    : milestoneDate
                  : 'Not set'}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Team
              </span>
              <span className="font-semibold text-slate-700">
                {membersCount} member{membersCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock3 className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Progress
              </span>
              <span className="font-semibold text-slate-700">{progressPercent ?? 0}%</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
