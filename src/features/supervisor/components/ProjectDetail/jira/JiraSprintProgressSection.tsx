import { AlertTriangle, CalendarClock, TrendingDown, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useJiraSprintProgress } from '../../../hooks/useJiraSprintProgress';
import type { JiraSprintProgress, JiraSprintSummary } from '../../../types';

type JiraSprintProgressSectionProps = {
  fetcher: (projectId: string) => Promise<JiraSprintProgress>;
  projectId: string;
};

function formatWeekLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatSprintRange(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) {
    return 'Schedule not available';
  }

  const startLabel = startDate
    ? new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Unknown';
  const endLabel = endDate
    ? new Date(endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Unknown';
  return `${startLabel} - ${endLabel}`;
}

function SprintSummaryRow({ sprint }: { sprint: JiraSprintSummary }) {
  const completion = Math.max(0, Math.min(100, sprint.completionPercent));

  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {sprint.sprintName?.trim() || 'Unnamed sprint'}
          </p>
          <p className="text-xs text-slate-600">
            {formatSprintRange(sprint.startDate, sprint.endDate)}
            {sprint.sprintState ? ` • ${sprint.sprintState}` : ''}
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
          {completion.toFixed(0)}% done
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-emerald-500"
          style={{ width: `${completion}%` }}
          aria-hidden
        />
      </div>
    </li>
  );
}

function JiraSprintProgressSkeleton() {
  return (
    <section className="space-y-3" aria-label="Loading sprint progress">
      <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-36 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
      </div>
    </section>
  );
}

export function JiraSprintProgressSection({ fetcher, projectId }: JiraSprintProgressSectionProps) {
  const { progress, isLoading, error, reload } = useJiraSprintProgress(fetcher, projectId);

  if (isLoading) {
    return <JiraSprintProgressSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  if (!progress || !progress.sprintDataAvailable) {
    return (
      <EmptyState
        title="Sprint insights are unavailable"
        description="No sprint-linked Jira issues are available yet for this project. Once sprint metadata is synced, velocity and sprint progress will appear here."
      />
    );
  }

  const activeSprint = progress.activeSprint;
  const maxVelocity = Math.max(
    1,
    ...progress.velocityWeeks.map((week) => Math.max(week.created, week.resolved)),
  );

  return (
    <section id="jira-sprint-progress" className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <h2 className="text-base font-semibold tracking-wide text-slate-900">Sprint progress</h2>
        <p className="text-sm text-slate-600">Delivery velocity and sprint completion trend</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Active sprint</h3>

          {activeSprint ? (
            <>
              <p className="mt-2 text-sm text-slate-700">
                {activeSprint.sprintName?.trim() || 'Unnamed sprint'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatSprintRange(activeSprint.startDate, activeSprint.endDate)}
              </p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Completion</span>
                  <span className="font-semibold text-slate-800">
                    {activeSprint.completionPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, activeSprint.completionPercent))}%`,
                    }}
                    aria-hidden
                  />
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {activeSprint.issuesDone} done of {activeSprint.issuesTotal} issues
                </p>
                {activeSprint.sprintPointsAvailable ? (
                  <p className="mt-1 text-xs text-slate-600">
                    {activeSprint.sprintPointsDone.toFixed(1)} /{' '}
                    {activeSprint.sprintPointsTotal.toFixed(1)} story points done
                  </p>
                ) : (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Story point data unavailable
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              No active sprint detected. Recent sprint history is still shown below.
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm xl:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Weekly velocity</h3>
          {progress.velocityWeeks.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {progress.velocityWeeks.map((week) => {
                const createdWidth = (week.created / maxVelocity) * 100;
                const resolvedWidth = (week.resolved / maxVelocity) * 100;

                return (
                  <li key={week.weekStart} className="grid grid-cols-12 items-center gap-2 text-xs">
                    <span className="col-span-3 text-slate-600">
                      {formatWeekLabel(week.weekStart)}
                    </span>
                    <div className="col-span-4 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-sky-500"
                        style={{ width: `${createdWidth}%` }}
                        aria-label={`Created ${week.created}`}
                      />
                    </div>
                    <div className="col-span-4 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${resolvedWidth}%` }}
                        aria-label={`Resolved ${week.resolved}`}
                      />
                    </div>
                    <span className="col-span-1 text-right text-slate-500">
                      {week.created}/{week.resolved}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              Weekly velocity is not available yet.
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Created
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Resolved
            </span>
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Recent sprints</h3>
          {progress.recentSprints.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {progress.recentSprints.slice(0, 3).map((sprint) => (
                <SprintSummaryRow
                  key={`${sprint.sprintId ?? 'unknown'}-${sprint.sprintName ?? 'sprint'}`}
                  sprint={sprint}
                />
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              No recent sprint history is available.
            </div>
          )}
        </article>

        <article
          className={`rounded-2xl border px-4 py-4 shadow-sm ${
            progress.backlogGrowing
              ? 'border-amber-200 bg-amber-50'
              : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <h3 className="text-sm font-semibold text-slate-900">Backlog signal</h3>
          <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
            {progress.backlogGrowing ? (
              <>
                <TrendingUp className="h-4 w-4 text-amber-700" />
                <span className="text-amber-800">Backlog is growing</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-emerald-700" />
                <span className="text-emerald-800">Backlog is stable</span>
              </>
            )}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {progress.backlogGrowing
              ? 'Created issues exceeded resolved issues across consecutive weeks. Consider reducing carry-over.'
              : 'Resolved work is keeping up with incoming issues over recent weeks.'}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-600">
            <CalendarClock className="h-3.5 w-3.5" />
            Based on the last {progress.velocityWeeks.length} synced week(s)
          </p>
        </article>
      </div>
    </section>
  );
}
