import type { JiraWorkload } from '../../../../types';

type JiraWorkloadBarChartProps = {
  workload: JiraWorkload;
};

export function JiraWorkloadBarChart({ workload }: JiraWorkloadBarChartProps) {
  const maxAssigned = Math.max(1, ...workload.members.map((m) => m.assigned));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Work Distribution</h3>
        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
            Completed
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-sm" />
            In Progress
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-300 shadow-sm" />
            To Do
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {workload.members.map((member) => {
          const toDo = Math.max(0, member.openIssues - member.inProgress);
          const completedPct = (member.completed / maxAssigned) * 100;
          const inProgressPct = (member.inProgress / maxAssigned) * 100;
          const toDoPct = (toDo / maxAssigned) * 100;

          return (
            <div key={member.accountId} className="group flex items-center gap-4">
              <div className="w-32 shrink-0 truncate text-right text-xs font-semibold text-slate-700 transition-colors group-hover:text-indigo-600">
                {member.displayName}
              </div>
              <div className="relative flex h-6 w-full items-center overflow-hidden rounded-full bg-slate-50 shadow-inner">
                {member.assigned === 0 ? (
                  <span className="absolute left-3 text-[10px] font-bold tracking-widest text-slate-400">
                    NO WORK ASSIGNED
                  </span>
                ) : (
                  <>
                    <div
                      className="h-full bg-emerald-500 transition-all duration-700 ease-out hover:brightness-110"
                      style={{ width: `${completedPct}%` }}
                      title={`${member.completed} Completed`}
                    />
                    <div
                      className="h-full bg-indigo-500 transition-all duration-700 ease-out border-l border-white/20 hover:brightness-110"
                      style={{ width: `${inProgressPct}%` }}
                      title={`${member.inProgress} In Progress`}
                    />
                    <div
                      className="h-full bg-slate-300 transition-all duration-700 ease-out border-l border-white/40 hover:brightness-95"
                      style={{ width: `${toDoPct}%` }}
                      title={`${toDo} To Do`}
                    />
                  </>
                )}
              </div>
              <div className="w-8 shrink-0 text-right text-xs font-black tabular-nums text-slate-500">
                {member.assigned}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
