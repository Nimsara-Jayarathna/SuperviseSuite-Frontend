import { CalendarDays, Clock3, Users } from 'lucide-react';
import { parseLocalDateOnly } from '@/lib/dateOnly';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

type StudentProjectDetailsHighlightsProps = {
  milestoneDate: string | null;
  membersCount: number;
  progressPercent: number | null;
};

export function StudentProjectDetailsHighlights({
  milestoneDate,
  membersCount,
  progressPercent,
}: StudentProjectDetailsHighlightsProps) {
  const parsedMilestoneDate = milestoneDate ? parseLocalDateOnly(milestoneDate) : null;

  return (
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
  );
}
