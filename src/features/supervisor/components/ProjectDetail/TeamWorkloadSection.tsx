import { TimeAgo } from '@/components/ui/TimeAgo';
import type { TeamWorkloadResponse, TeamWorkloadStudent } from '../../types';

type TeamWorkloadSectionProps = {
  workload: TeamWorkloadResponse;
};

function isLastActiveStale(lastActiveDate: string | null, now: Date): boolean {
  if (!lastActiveDate) {
    return false;
  }
  const activeDate = new Date(`${lastActiveDate}T00:00:00`);
  if (Number.isNaN(activeDate.getTime())) {
    return false;
  }
  const elapsedMs = now.getTime() - activeDate.getTime();
  return elapsedMs > 3 * 24 * 60 * 60 * 1000;
}

function getBarFillWidth(assigned: number, maxAssigned: number): number {
  if (maxAssigned <= 0) {
    return 0;
  }
  return Math.max(8, Math.round((assigned / maxAssigned) * 100));
}

function renderLastActiveCell(student: TeamWorkloadStudent, now: Date) {
  if (!student.lastActiveDate) {
    return <span className="text-slate-400">-</span>;
  }

  const stale = isLastActiveStale(student.lastActiveDate, now);
  return (
    <div className={stale ? 'text-amber-700' : 'text-slate-600'}>
      <TimeAgo date={`${student.lastActiveDate}T00:00:00`} />
    </div>
  );
}

export function TeamWorkloadSection({ workload }: TeamWorkloadSectionProps) {
  const now = new Date();
  const maxAssigned = Math.max(0, ...workload.students.map((student) => student.assigned));
  const outlierAssigneeId =
    workload.imbalanceDetected && workload.students.length > 0
      ? workload.students[0].assigneeAccountId
      : null;

  return (
    <section className="space-y-5 rounded-3xl border border-border bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-foreground">Team workload analytics</h2>
        <p className="mt-1 text-sm text-slate-600">
          Snapshot of Jira workload distribution across students.
        </p>
      </header>

      {workload.imbalanceDetected && workload.imbalanceMessage ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Workload imbalance detected</p>
          <p className="mt-1">{workload.imbalanceMessage}</p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Workload by student</h3>
        {workload.students.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No assigned student workload to visualize.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {workload.students.map((student) => {
              const isOutlier = outlierAssigneeId !== null && student.assigneeAccountId === outlierAssigneeId;
              const fillWidth = getBarFillWidth(student.assigned, maxAssigned);
              return (
                <div key={student.assigneeAccountId} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-700">{student.displayName}</span>
                    <span className="font-semibold text-slate-600">{student.assigned} assigned</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOutlier ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${fillWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Student</th>
              <th className="px-4 py-3 text-right font-medium">Assigned</th>
              <th className="px-4 py-3 text-right font-medium">Completed</th>
              <th className="px-4 py-3 text-right font-medium">In Progress</th>
              <th className="px-4 py-3 text-right font-medium">
                <div className="inline-flex items-center gap-1">
                  <span>Overdue</span>
                  {!workload.dueDateAvailable ? (
                    <span
                      className="cursor-help rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-amber-700"
                      title="Estimated from last activity because Jira due dates are unavailable."
                    >
                      estimate
                    </span>
                  ) : null}
                </div>
              </th>
              <th className="px-4 py-3 text-right font-medium">Completion Rate</th>
              <th className="px-4 py-3 text-right font-medium">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workload.students.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={7}>
                  No student workload records found.
                </td>
              </tr>
            ) : (
              workload.students.map((student) => {
                const lowCompletion = student.completionRate < 50;
                const hasOverdue = student.overdue > 0;
                return (
                  <tr key={student.assigneeAccountId} className="align-middle">
                    <td className="px-4 py-3 font-medium text-slate-800">{student.displayName}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{student.assigned}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{student.completed}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{student.inProgress}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${hasOverdue ? 'text-rose-700' : 'text-slate-700'}`}>
                      {student.overdue}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${lowCompletion ? 'text-amber-700' : 'text-slate-700'}`}>
                      {student.completionRate}%
                    </td>
                    <td className="px-4 py-3 text-right">{renderLastActiveCell(student, now)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {workload.unassignedIssues > 0 ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Unassigned Jira issues: {workload.unassignedIssues}</p>
          <p className="mt-1">
            These issues are not currently tracked against a specific student.
          </p>
        </section>
      ) : null}
    </section>
  );
}
