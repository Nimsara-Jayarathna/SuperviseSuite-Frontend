import { CalendarDays, Flag } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { parseLocalDateOnly } from '@/lib/dateOnly';
import type { StudentProjectDetailMilestone } from '../../types';
import { getMilestoneStatusIcon, getMilestoneTone } from '../../utils/projectDetails/presentation';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

type StudentProjectMilestonesTabProps = {
  milestones: StudentProjectDetailMilestone[];
};

export function StudentProjectMilestonesTab({ milestones }: StudentProjectMilestonesTabProps) {
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col">
        <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Milestones</h2>
        <p className="text-xs font-medium text-slate-400">
          Total {milestones.length} milestones defined
        </p>
      </div>

      {milestones.length > 0 ? (
        <div className="mt-6 space-y-4">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:shadow-lg group"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-base font-black text-slate-400 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    {String(milestone.sequenceNo).padStart(2, '0')}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <h4 className="text-lg font-black tracking-tight text-slate-800 transition-colors group-hover:text-indigo-900">
                        {milestone.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {(() => {
                          const dueDate = parseLocalDateOnly(milestone.dueDate);
                          return (
                            <span>
                              Due {dueDate ? dateFormatter.format(dueDate) : milestone.dueDate}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getMilestoneStatusIcon(milestone.status, 'h-4 w-4 text-slate-300')}
                      <StatusBadge tone={getMilestoneTone(milestone.status)}>
                        {milestone.status.replace('_', ' ')}
                      </StatusBadge>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-500 line-clamp-2">
                    {milestone.description ?? 'No description provided for this milestone.'}
                  </p>
                </div>
              </div>

              {index < milestones.length - 1 && (
                <div className="absolute left-[3.5rem] bottom-0 top-[4.5rem] w-0.5 bg-slate-50 -z-10 group-hover:bg-indigo-50/50" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 shadow-inner">
            <Flag className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-bold">No milestones recorded yet.</p>
        </div>
      )}
    </section>
  );
}
