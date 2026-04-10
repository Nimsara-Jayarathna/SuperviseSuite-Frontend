import type { JiraWorkload } from '../../../../types';

type JiraWorkloadBarChartProps = {
  workload: JiraWorkload;
};

const TYPE_PRIORITY: Record<string, number> = {
  epic: 1,
  story: 2,
  bug: 3,
  defect: 3,
  task: 4,
  'sub-task': 5,
  subtask: 5,
};

function getSortWeight(type: string): number {
  const t = type.toLowerCase();
  for (const [key, weight] of Object.entries(TYPE_PRIORITY)) {
    if (t.includes(key)) return weight;
  }
  return 99;
}

function getBadgeColors(type: string): string {
  const normType = type.toLowerCase();
  if (normType.includes('bug') || normType.includes('defect')) {
    return 'bg-rose-50/80 text-rose-700';
  }
  if (normType.includes('story')) {
    return 'bg-emerald-50/80 text-emerald-700';
  }
  if (normType.includes('epic')) {
    return 'bg-purple-50/80 text-purple-700';
  }
  if (normType.includes('sub-task') || normType.includes('subtask')) {
    return 'bg-sky-50/80 text-sky-700';
  }
  if (normType.includes('task')) {
    return 'bg-indigo-50/80 text-indigo-700';
  }
  return 'bg-slate-50/80 text-slate-700';
}

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

      <div className="space-y-3">
        {workload.members.map((member) => {
          const toDo = Math.max(0, member.openIssues - member.inProgress);
          const completedPct = (member.completed / maxAssigned) * 100;
          const inProgressPct = (member.inProgress / maxAssigned) * 100;
          const toDoPct = (toDo / maxAssigned) * 100;

          return (
            <div key={member.accountId} className="group flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <div className="w-32 shrink-0 truncate text-right text-xs font-semibold text-slate-700 transition-colors group-hover:text-indigo-600">
                  {member.displayName}
                </div>
                <div className="relative flex h-[10px] w-full items-center overflow-hidden rounded-full bg-slate-100 shadow-inner">
                  {member.assigned > 0 && (
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

              {member.assigned === 0 ? (
                <div className="flex pl-[9rem] pt-0.5">
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold tracking-widest text-slate-400 bg-slate-50 border border-slate-100">
                    NO WORK ASSIGNED
                  </span>
                </div>
              ) : (
                member.issueTypeCounts &&
                Object.keys(member.issueTypeCounts).length > 0 && (
                  <div className="flex pl-[9rem] pt-0.5">
                    <div className="flex overflow-hidden rounded-md border border-slate-200/50 shadow-sm divide-x divide-slate-200/50">
                      {Object.entries(member.issueTypeCounts)
                        .sort((a, b) => getSortWeight(a[0]) - getSortWeight(b[0]))
                        .map(([type, count]) => (
                          <span
                            key={type}
                            className={`inline-flex items-center px-2 py-[2px] text-[10px] font-semibold tracking-wide ${getBadgeColors(type)}`}
                          >
                            {type}{' '}
                            <span className="ml-1 opacity-70 px-1 border-l border-current">
                              {count}
                            </span>
                          </span>
                        ))}
                    </div>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
