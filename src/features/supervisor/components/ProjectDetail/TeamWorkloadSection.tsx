import { RefreshCw } from 'lucide-react';
import { TimeAgo } from '@/components/ui/TimeAgo';
import type { TeamWorkloadResponse, TeamWorkloadStudent } from '../../types';

type TeamWorkloadSectionProps = {
  workload: TeamWorkloadResponse;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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

function getBarFillWidth(openIssues: number, maxOpenIssues: number): number {
  if (maxOpenIssues <= 0) {
    return 0;
  }
  return Math.max(8, Math.round((openIssues / maxOpenIssues) * 100));
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

export function TeamWorkloadSection({ workload, onRefresh, isRefreshing }: TeamWorkloadSectionProps) {
  const now = new Date();
  const hasNoStudentRows = workload.students.length === 0;
  const hasNoUnassignedIssues = workload.unassignedIssues === 0;
  const hasNoWorkloadData = hasNoStudentRows && hasNoUnassignedIssues;
  const maxOpenIssues = Math.max(
    0, 
    ...workload.students.map((s) => Math.max(0, s.assigned - s.completed))
  );
  const outlierAssigneeId =
    workload.imbalanceDetected && workload.students.length > 0
      ? workload.students[0].assigneeAccountId
      : null;

  const studentKey = (student: TeamWorkloadStudent, index: number): string => {
    const primary = student.assigneeAccountId || student.displayName || 'student';
    return `${primary}-${index}`;
  };

  return (
    <section className="space-y-5 rounded-3xl border border-border bg-white p-6 shadow-sm">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team workload analytics</h2>
          <p className="mt-1 text-sm text-slate-600">
            Snapshot of Jira workload distribution across students.
          </p>
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        ) : null}
      </header>

      {hasNoWorkloadData ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No Jira work items were found for this project yet.
        </div>
      ) : null}

      {!hasNoWorkloadData && workload.imbalanceDetected && workload.imbalanceMessage ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Workload imbalance detected</p>
          <p className="mt-1">{workload.imbalanceMessage}</p>
        </div>
      ) : null}

      {!hasNoStudentRows ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Workload by student</h3>
          <div className="mt-4 space-y-3">
            {workload.students.map((student, index) => {
              const isOutlier =
                outlierAssigneeId !== null && student.assigneeAccountId === outlierAssigneeId;
              const openIssues = Math.max(0, student.assigned - student.completed);
              const fillWidth = getBarFillWidth(openIssues, maxOpenIssues);
              return (
                <div key={studentKey(student, index)} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-700">{student.displayName}</span>
                    <span className="font-semibold text-slate-600">
                      {openIssues} open
                    </span>
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
          <p className="mt-3 text-xs text-slate-500">
            Bar width reflects open (incomplete) issues only. 
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-full bg-emerald-500" /> Balanced
            </span>
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-full bg-amber-500" /> Overloaded
            </span>
          </p>
        </section>
      ) : null}

      {!hasNoStudentRows ? (
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Student</th>
                <th className="px-4 py-3 text-right font-medium">Assigned</th>
                <th className="px-4 py-3 text-right font-medium">Completed</th>
                <th className="px-4 py-3 text-right font-medium">SP Assigned</th>
                <th className="px-4 py-3 text-right font-medium">SP Done</th>
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
              {workload.students.map((student, index) => {
                const lowCompletion = student.completionRate < 50;
                const hasOverdue = student.overdue > 0;
                return (
                  <tr key={studentKey(student, index)} className="align-middle">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {student.displayName}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{student.assigned}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{student.completed}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {student.storyPointsAssigned > 0
                        ? student.storyPointsAssigned
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {student.storyPointsCompleted > 0
                        ? student.storyPointsCompleted
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{student.inProgress}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${hasOverdue ? 'text-rose-700' : 'text-slate-700'}`}
                    >
                      {student.overdue}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${lowCompletion ? 'text-amber-700' : 'text-slate-700'}`}
                    >
                      {student.completionRate}%
                    </td>
                    <td className="px-4 py-3 text-right">{renderLastActiveCell(student, now)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      {workload.unassignedIssues > 0 ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Unassigned Jira issues: {workload.unassignedIssues}</p>
          <p className="mt-1">Assign these in Jira to include them in workload tracking.</p>
        </section>
      ) : null}
    </section>
  );
}
