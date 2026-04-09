import { AlertTriangle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useJiraSprintProgress } from '../../../hooks/useJiraSprintProgress';
import type { JiraSprintProgress, JiraSprintSummary } from '../../../types';

type JiraSprintProgressSectionProps = {
  fetcher: (projectId: string) => Promise<JiraSprintProgress>;
  projectId: string;
};

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

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function ceilDaysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / msPerDay));
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
  const issueCompletionRatio =
    activeSprint && activeSprint.issuesTotal > 0
      ? activeSprint.issuesDone / activeSprint.issuesTotal
      : activeSprint
        ? activeSprint.completionPercent / 100
        : 0;
  const pointsCompletionRatio =
    activeSprint && activeSprint.sprintPointsAvailable && activeSprint.sprintPointsTotal > 0
      ? activeSprint.sprintPointsDone / activeSprint.sprintPointsTotal
      : null;
  const sprintHealthScore = clampPercent(
    Math.round(
      (pointsCompletionRatio === null
        ? issueCompletionRatio
        : issueCompletionRatio * 0.55 + pointsCompletionRatio * 0.45) * 100,
    ),
  );
  const compactRingRadius = 18;
  const compactRingCircumference = 2 * Math.PI * compactRingRadius;
  const compactRingStrokeOffset =
    compactRingCircumference - (sprintHealthScore / 100) * compactRingCircumference;

  const issueCompletionPercent = clampPercent(Math.round(issueCompletionRatio * 100));
  const pointsCompletionPercent = clampPercent(
    Math.round((pointsCompletionRatio ?? issueCompletionRatio) * 100),
  );

  const now = new Date();
  const sprintStart = activeSprint?.startDate ? new Date(activeSprint.startDate) : null;
  const sprintEnd = activeSprint?.endDate ? new Date(activeSprint.endDate) : null;
  const hasValidSprintWindow =
    sprintStart !== null &&
    sprintEnd !== null &&
    !Number.isNaN(sprintStart.getTime()) &&
    !Number.isNaN(sprintEnd.getTime()) &&
    sprintEnd.getTime() > sprintStart.getTime();

  const totalSprintDays =
    hasValidSprintWindow && sprintStart && sprintEnd
      ? Math.max(1, ceilDaysBetween(sprintStart, sprintEnd))
      : 1;
  const elapsedSprintDays =
    hasValidSprintWindow && sprintStart && sprintEnd
      ? Math.min(totalSprintDays, Math.max(0, totalSprintDays - ceilDaysBetween(now, sprintEnd)))
      : 0;
  const daysLeft = hasValidSprintWindow && sprintEnd ? ceilDaysBetween(now, sprintEnd) : null;

  const projectedIssueDoneCount =
    activeSprint && elapsedSprintDays > 0
      ? Math.min(
          activeSprint.issuesTotal,
          Math.round((activeSprint.issuesDone / elapsedSprintDays) * totalSprintDays),
        )
      : (activeSprint?.issuesDone ?? 0);

  const sprintVelocitySeries = progress.recentSprints
    .slice(0, 3)
    .reverse()
    .map((sprint, index) => ({
      id: sprint.sprintId ?? index,
      label: sprint.sprintName?.trim() || `Sprint ${index}`,
      value:
        sprint.sprintPointsDone > 0
          ? Number(sprint.sprintPointsDone.toFixed(1))
          : Number(sprint.issuesDone.toFixed(1)),
    }));
  const sprintVelocityAverage =
    sprintVelocitySeries.length > 0
      ? sprintVelocitySeries.reduce((sum, item) => sum + item.value, 0) /
        sprintVelocitySeries.length
      : 0;
  const latestVelocityWeek =
    progress.velocityWeeks.length > 0 ? progress.velocityWeeks[progress.velocityWeeks.length - 1] : null;
  const thisWeekClosed = latestVelocityWeek?.resolved ?? 0;
  const thisWeekOpened = latestVelocityWeek?.created ?? 0;
  const thisWeekNet = thisWeekClosed - thisWeekOpened;
  const thisWeekAvgCycleDays = latestVelocityWeek?.averageCycleDays ?? null;

  const scopeInjectionEvents = (() => {
    if (!hasValidSprintWindow || !sprintStart || !sprintEnd) {
      return [] as Array<{ dayIndex: number; issuesAdded: number }>;
    }

    return progress.velocityWeeks
      .map((week) => {
        const weekStart = new Date(week.weekStart);
        if (Number.isNaN(weekStart.getTime())) {
          return null;
        }

        if (weekStart < sprintStart || weekStart > sprintEnd) {
          return null;
        }

        if (week.created <= 0) {
          return null;
        }

        const dayIndex = Math.min(
          totalSprintDays,
          Math.max(1, ceilDaysBetween(sprintStart, weekStart) + 1),
        );
        return {
          dayIndex,
          issuesAdded: week.created,
        };
      })
      .filter((event): event is { dayIndex: number; issuesAdded: number } => event !== null)
      .reduce<Array<{ dayIndex: number; issuesAdded: number }>>((acc, event) => {
        const existing = acc.find((item) => item.dayIndex === event.dayIndex);
        if (existing) {
          existing.issuesAdded += event.issuesAdded;
        } else {
          acc.push({ ...event });
        }
        return acc;
      }, [])
      .sort((a, b) => a.dayIndex - b.dayIndex);
  })();

  const plannedIssues = Math.max(0, activeSprint?.sprintStartIssueCount ?? 0);
  const additionsIssues = Math.max(0, (activeSprint?.issuesTotal ?? 0) - plannedIssues);
  const scopeGrowthPercent =
    plannedIssues > 0 ? Math.round((additionsIssues / plannedIssues) * 100) : 0;
  const shouldShowScopeChangeTracker = plannedIssues > 0 && Boolean(activeSprint);

  const scopeTimelineData = Array.from({ length: totalSprintDays }, (_, index) => {
    const dayIndex = index + 1;
    const event = scopeInjectionEvents.find((item) => item.dayIndex === dayIndex);
    return {
      day: dayIndex,
      baseline: 0,
      added: event ? event.issuesAdded : 0,
    };
  });

  return (
    <section id="jira-sprint-progress" className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="inline-flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-wide text-slate-900">Sprint progress</h2>
          {shouldShowScopeChangeTracker ? (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400"
              title="Scope changed after sprint start"
              aria-label="Scope changed"
            />
          ) : null}
        </div>
        <p className="text-sm text-slate-600">Delivery velocity and sprint completion trend</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-3">
          <article className="rounded-lg border-[0.5px] border-slate-200 bg-white px-4 py-4 shadow-sm">
            {activeSprint ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">Active sprint</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {activeSprint.sprintName?.trim() || 'Unnamed sprint'}
                      </p>
                      {daysLeft !== null ? (
                        <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatSprintRange(activeSprint.startDate, activeSprint.endDate)}
                    </p>
                  </div>

                  <svg
                    viewBox="0 0 48 48"
                    className="h-12 w-12 shrink-0"
                    role="img"
                    aria-label={`Sprint health score ${sprintHealthScore}%`}
                  >
                    <circle
                      cx="24"
                      cy="24"
                      r={compactRingRadius}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="5"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r={compactRingRadius}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={compactRingCircumference}
                      strokeDashoffset={compactRingStrokeOffset}
                      transform="rotate(-90 24 24)"
                    />
                    <text
                      x="24"
                      y="27"
                      textAnchor="middle"
                      className="fill-slate-700 text-[9px] font-semibold"
                    >
                      {sprintHealthScore}
                    </text>
                  </svg>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Issue completion</span>
                    <span className="font-semibold text-slate-800">{issueCompletionPercent}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${issueCompletionPercent}%` }}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {activeSprint.issuesDone} done of {activeSprint.issuesTotal} issues
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span>SP completion</span>
                    <span className="font-semibold text-slate-800">{pointsCompletionPercent}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-sky-500"
                      style={{ width: `${pointsCompletionPercent}%` }}
                      aria-hidden
                    />
                  </div>
                  {activeSprint.sprintPointsAvailable ? (
                    <p className="mt-1 text-xs text-slate-600">
                      {activeSprint.sprintPointsDone.toFixed(1)} /{' '}
                      {activeSprint.sprintPointsTotal.toFixed(1)} SP done
                    </p>
                  ) : (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      SP data unavailable
                    </p>
                  )}

                  <p className="mt-3 text-xs text-slate-500">
                    Est. {projectedIssueDoneCount}/{activeSprint.issuesTotal} issues by sprint end
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No active sprint detected. Recent sprint history is still shown below.
              </div>
            )}
          </article>

          {shouldShowScopeChangeTracker && activeSprint ? (
            <article
              className="px-4 py-3"
              style={{
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-lg)',
              }}
            >
              <h3 className="text-sm font-semibold text-slate-900">Scope change tracker</h3>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
                  <p className="text-[11px] font-semibold text-slate-600">Planned</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">{plannedIssues} issues</p>
                </div>
                <div
                  className="rounded-md px-2 py-2"
                  style={{ background: '#FAEEDA', color: '#854F0B' }}
                >
                  <p className="text-[11px] font-semibold">Added</p>
                    <p className="mt-1 text-xs font-semibold">+{additionsIssues} issues</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
                  <p className="text-[11px] font-semibold text-slate-600">Current</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {activeSprint.issuesTotal} issues
                    </p>
                </div>
              </div>

              <div className="mt-3 h-10 rounded-md border border-slate-200 bg-white px-1 py-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={scopeTimelineData}
                    margin={{ top: 4, right: 10, left: 10, bottom: 0 }}
                  >
                    <Tooltip
                      formatter={(value, name, item) => {
                        if (name !== 'added' || Number(value ?? 0) <= 0) {
                          return [null, null];
                        }
                        const day = (item?.payload as { day?: number } | undefined)?.day ?? 0;
                        return [`${Number(value).toFixed(0)} issues added - Day ${day}`, ''];
                      }}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '0.5px solid #D3D1C7',
                      }}
                    />
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Line
                      type="linear"
                      dataKey="baseline"
                      stroke="#D3D1C7"
                      strokeWidth={2}
                      dot={false}
                    />
                    <ReferenceDot x={1} y={0} r={3} fill="#1D9E75" stroke="#1D9E75" />
                    <Line
                      type="linear"
                      dataKey="added"
                      stroke="#EF9F27"
                      strokeWidth={0}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (!payload || payload.added <= 0) {
                          return null;
                        }
                        return (
                          <rect
                            x={Number(cx) - 1}
                            y={Number(cy) - 9}
                            width={2}
                            height={18}
                            fill="#EF9F27"
                            rx={1}
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-2 text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
                Scope grew {scopeGrowthPercent}% after sprint start - original plan was {plannedIssues}{' '}
                issues, sprint closed with {activeSprint.issuesTotal}.
              </p>
            </article>
          ) : null}
        </div>

        <div className="space-y-3 xl:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Sprint velocity</h3>
              <p className="text-xs font-semibold text-slate-700">
                Avg: {Math.round(sprintVelocityAverage)} SP/sprint
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-600">Use for Sprint 3 planning baseline.</p>

            {sprintVelocitySeries.length > 0 ? (
              <div className="mt-3">
                <div className="h-36 rounded-lg border border-slate-200 bg-white px-2 py-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sprintVelocitySeries}
                      margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#D3D1C7" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#5F5E5A', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#5F5E5A', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`${Number(value ?? 0).toFixed(1)} SP`, 'Completed']}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: '0.5px solid #D3D1C7',
                        }}
                      />
                      <ReferenceLine
                        y={Number(sprintVelocityAverage.toFixed(1))}
                        stroke="#EF9F27"
                        strokeDasharray="4 3"
                        label={{
                          value: `Avg: ${Math.round(sprintVelocityAverage)} SP`,
                          position: 'right',
                          fill: '#5F5E5A',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="#378ADD" stroke="#185FA5" radius={[4, 4, 0, 0]}>
                        <LabelList
                          dataKey="value"
                          position="top"
                          style={{ fontWeight: 500, fontSize: 13, fill: '#5F5E5A' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  3-sprint rolling average shown as dashed baseline.
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-600">
                Sprint velocity is not available yet.
              </div>
            )}
          </section>

          <p
            className="flex items-center gap-2"
            style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
          >
            <span style={{ color: '#EF9F27' }} aria-hidden>
              ●
            </span>
            Backlog net +35 over 8 weeks - created consistently exceeding resolved. Consider scope
            reduction before Sprint 3.
          </p>

          <section>
            <h3 className="text-sm font-semibold text-slate-900">This week</h3>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <div
                className="flex flex-col"
                style={{
                  background: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 14px',
                }}
              >
                <span className="font-medium text-emerald-600" style={{ fontSize: 18 }}>
                  {thisWeekClosed}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Closed</span>
              </div>
              <div
                className="flex flex-col"
                style={{
                  background: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 14px',
                }}
              >
                <span className="font-medium text-slate-900" style={{ fontSize: 18 }}>
                  {thisWeekOpened}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Opened</span>
              </div>
              <div
                className="flex flex-col"
                style={{
                  background: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 14px',
                }}
              >
                <span
                  className="font-medium"
                  style={{
                    fontSize: 18,
                    color: thisWeekNet < 0 ? '#DC2626' : '#059669',
                  }}
                >
                  {thisWeekNet > 0 ? `+${thisWeekNet}` : thisWeekNet}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Net</span>
              </div>
              <div
                className="flex flex-col"
                style={{
                  background: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '10px 14px',
                }}
              >
                <span className="font-medium text-slate-900" style={{ fontSize: 18 }}>
                  {thisWeekAvgCycleDays === null ? 'N/A' : `${thisWeekAvgCycleDays.toFixed(1)}d`}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  Avg cycle
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
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
      </div>
    </section>
  );
}
