import { HelpCircle } from 'lucide-react';
import type { JiraWorkload } from '../../../../types';

type JiraWorkloadUnassignedCardProps = {
  workload: JiraWorkload;
};

export function JiraWorkloadUnassignedCard({ workload }: JiraWorkloadUnassignedCardProps) {
  if (workload.unassignedCount === 0) {
    return null;
  }

  return (
    <div className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-inner transition-colors group-hover:bg-slate-200 group-hover:text-slate-600">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-bold text-slate-800">Unassigned issues</p>
          <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
            Items in the backlog without an owner
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-2xl font-black tabular-nums tracking-tight text-slate-800">
          {workload.unassignedCount}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Issues
        </span>
      </div>
    </div>
  );
}
