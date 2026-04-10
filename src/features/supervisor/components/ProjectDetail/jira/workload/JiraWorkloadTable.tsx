import { AlertCircle, Clock } from 'lucide-react';
import type { JiraWorkload } from '../../../../types';

type JiraWorkloadTableProps = {
  workload: JiraWorkload;
};

function formatLastActive(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 30) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return `${diffDays}d ago`;
}

export function JiraWorkloadTable({ workload }: JiraWorkloadTableProps) {
  const hasStoryPoints = workload.members.some((m) => m.storyPointsAssigned !== null);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 sm:px-6 sm:py-4 sticky left-0 z-10 bg-slate-50 border-r border-slate-200 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)]">
                Student
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-center">Assigned</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-center">Completed</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-center">SP Assigned</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-center">SP Done</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-center">In Progress</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                <span className="flex items-center justify-center gap-1.5">
                  Overdue
                  {!workload.dueDateAvailable && (
                    <span
                      className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700"
                      title="Estimated based on inactivity since Jira due dates are not configured"
                    >
                      ESTIMATE
                    </span>
                  )}
                </span>
              </th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Completion Rate</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workload.members.map((member) => {
              return (
                <tr key={member.accountId} className="group transition-colors hover:bg-slate-50/70">
                  <td className="px-4 py-3 sm:px-6 sm:py-4 sticky left-0 z-10 bg-white transition-colors group-hover:bg-slate-50 border-r border-slate-100 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800">{member.displayName}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-center tabular-nums text-slate-600 font-medium">
                    <span className="text-indigo-600 font-semibold">{member.assigned}</span>
                  </td>

                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-center tabular-nums text-slate-600 font-medium whitespace-nowrap">
                    {member.completed}
                  </td>

                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-center tabular-nums text-slate-600 font-medium">
                    {hasStoryPoints && member.storyPointsAssigned !== null
                      ? member.storyPointsAssigned
                      : '—'}
                  </td>

                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-center tabular-nums text-slate-600 font-medium">
                    {hasStoryPoints && member.storyPointsCompleted !== null
                      ? member.storyPointsCompleted
                      : '—'}
                  </td>

                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-center tabular-nums text-slate-600 font-medium">
                    {member.inProgress > 0 ? (
                      <span className="text-indigo-600 font-bold">{member.inProgress}</span>
                    ) : (
                      member.inProgress
                    )}
                  </td>

                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                    {member.overdue > 0 ? (
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 shadow-sm">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {member.overdue}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-medium">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                          style={{ width: `${member.completionRate}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs font-bold tabular-nums text-slate-600">
                        {member.completionRate}%
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatLastActive(member.lastActiveDate)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
