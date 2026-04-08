import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useJiraSprintProgress } from '../../../hooks/useJiraSprintProgress';
import type { JiraSprintProgress, JiraSprintSummary } from '../../../types';

type JiraSprintProgressSectionProps = {
  fetcher: (projectId: string) => Promise<JiraSprintProgress>;
  projectId: string;
};

type Point = {
  x: number;
  y: number;
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

function toPolylinePoints(values: number[], width: number, height: number): Point[] {
  if (values.length === 0) {
    return [];
  }

  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = Math.max(1, maxValue - minValue);

  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return { x, y };
  });
}

function toSvgPath(points: Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
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
  const cumulativeNetSeries = progress.velocityWeeks.reduce<number[]>((acc, week, index) => {
    const previous = index > 0 ? acc[index - 1] : 0;
    acc.push(previous + week.created - week.resolved);
    return acc;
  }, []);
  const latestNetBalance = cumulativeNetSeries[cumulativeNetSeries.length - 1] ?? 0;

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
  const elapsedRatio = totalSprintDays > 0 ? elapsedSprintDays / totalSprintDays : 0;

  const projectedIssueDoneCount =
    activeSprint && elapsedSprintDays > 0
      ? Math.min(
          activeSprint.issuesTotal,
          Math.round((activeSprint.issuesDone / elapsedSprintDays) * totalSprintDays),
        )
      : (activeSprint?.issuesDone ?? 0);

  const totalPoints = activeSprint?.sprintPointsTotal ?? 0;
  const donePoints = activeSprint?.sprintPointsDone ?? 0;
  const idealDonePoints = totalPoints * elapsedRatio;
  const pointsDeltaVsIdeal = Math.round(donePoints - idealDonePoints);

  const sprintVelocitySeries = progress.recentSprints
    .slice(0, 3)
    .reverse()
    .map((sprint, index) => ({
      id: sprint.sprintId ?? index,
      label: sprint.sprintName?.trim() || `Sprint ${index}`,
      completedPoints: sprint.sprintPointsAvailable ? sprint.sprintPointsDone : 0,
      pointsAvailable: sprint.sprintPointsAvailable,
    }));
  const maxSprintVelocity = Math.max(
    1,
    ...sprintVelocitySeries.map((item) => item.completedPoints),
  );
  const sprintVelocityAverage =
    sprintVelocitySeries.length > 0
      ? sprintVelocitySeries.reduce((sum, item) => sum + item.completedPoints, 0) /
        sprintVelocitySeries.length
      : 0;

  const netChartWidth = 420;
  const netChartHeight = 100;
  const netPoints = toPolylinePoints(cumulativeNetSeries, netChartWidth, netChartHeight);
  const netPath = toSvgPath(netPoints);
  const minNetValue = Math.min(0, ...cumulativeNetSeries);
  const maxNetValue = Math.max(0, ...cumulativeNetSeries);
  const netRange = Math.max(1, maxNetValue - minNetValue);
  const zeroLineY = netChartHeight - ((0 - minNetValue) / netRange) * netChartHeight;

  return (
    <section id="jira-sprint-progress" className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <h2 className="text-base font-semibold tracking-wide text-slate-900">Sprint progress</h2>
        <p className="text-sm text-slate-600">Delivery velocity and sprint completion trend</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
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
                  <span>Story points completion</span>
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
                    {activeSprint.sprintPointsTotal.toFixed(1)} story points done
                  </p>
                ) : (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Story point data unavailable
                  </p>
                )}

                <p className="mt-3 text-xs text-slate-500">
                  Est. {projectedIssueDoneCount}/{activeSprint.issuesTotal} issues by sprint end
                </p>

                {activeSprint.sprintPointsAvailable && hasValidSprintWindow ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <svg viewBox="0 0 180 36" className="h-10 w-full max-w-[180px]">
                        <line
                          x1="0"
                          y1="4"
                          x2="180"
                          y2="32"
                          stroke="#cbd5e1"
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                        />
                        <path
                          d={(() => {
                            const actualRemaining = Math.max(0, totalPoints - donePoints);
                            const projectedRemaining = Math.max(
                              0,
                              totalPoints -
                                (elapsedSprintDays > 0
                                  ? (donePoints / elapsedSprintDays) * totalSprintDays
                                  : donePoints),
                            );
                            const dayX =
                              totalSprintDays > 0 ? (elapsedSprintDays / totalSprintDays) * 180 : 0;
                            const todayY =
                              totalPoints > 0
                                ? 32 - ((totalPoints - actualRemaining) / totalPoints) * 28
                                : 32;
                            const projectedY =
                              totalPoints > 0
                                ? 32 - ((totalPoints - projectedRemaining) / totalPoints) * 28
                                : 32;
                            return `M 0 32 L ${dayX} ${todayY} L 180 ${projectedY}`;
                          })()}
                          fill="none"
                          stroke="#0f766e"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <p className="shrink-0 text-[11px] font-semibold text-slate-700">
                        {Math.abs(pointsDeltaVsIdeal)} pts{' '}
                        {pointsDeltaVsIdeal >= 0 ? 'ahead of ideal' : 'behind ideal'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              No active sprint detected. Recent sprint history is still shown below.
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm xl:col-span-2">
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Sprint velocity</h3>
                <p className="text-xs font-semibold text-slate-700">
                  Avg: {Math.round(sprintVelocityAverage)} pts/sprint
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-600">Use for Sprint 3 planning baseline.</p>

              {sprintVelocitySeries.length > 0 ? (
                <div className="mt-3">
                  <div className="relative flex h-32 items-end justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 pb-2 pt-3">
                    {sprintVelocitySeries.map((item) => {
                      const height = (item.completedPoints / maxSprintVelocity) * 80;
                      return (
                        <div
                          key={item.id}
                          className="flex min-w-0 flex-1 flex-col items-center gap-1"
                        >
                          <p className="text-[11px] font-semibold text-slate-700">
                            {Math.round(item.completedPoints)}
                          </p>
                          <div className="flex h-20 w-full items-end justify-center">
                            <div
                              className={`w-7 rounded-t-md ${item.pointsAvailable ? 'bg-sky-500' : 'bg-slate-300'}`}
                              style={{ height: `${Math.max(6, height)}px` }}
                              aria-label={`${item.label} completed points ${item.completedPoints}`}
                            />
                          </div>
                          <p className="truncate text-[11px] text-slate-600" title={item.label}>
                            {item.label}
                          </p>
                        </div>
                      );
                    })}

                    <div
                      className="pointer-events-none absolute left-3 right-3 border-t border-dashed border-amber-500"
                      style={{
                        bottom: `${8 + (sprintVelocityAverage / maxSprintVelocity) * 80}px`,
                      }}
                      aria-hidden
                    />
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

            <section className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Backlog trend</h3>
                <p
                  className={`text-xs font-semibold ${latestNetBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
                >
                  Net {latestNetBalance > 0 ? '+' : ''}
                  {latestNetBalance}
                </p>
              </div>

              <svg viewBox={`0 0 ${netChartWidth} ${netChartHeight}`} className="mt-2 h-10 w-full">
                <line
                  x1="0"
                  y1={zeroLineY}
                  x2={netChartWidth}
                  y2={zeroLineY}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
                {netPath ? (
                  <path
                    d={netPath}
                    fill="none"
                    stroke={latestNetBalance > 0 ? '#f59e0b' : '#10b981'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                ) : null}
              </svg>

              <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold">
                {progress.backlogGrowing ? (
                  <>
                    <TrendingUp className="h-3.5 w-3.5 text-amber-700" />
                    <span className="text-amber-800">Backlog is growing</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-700" />
                    <span className="text-emerald-800">Backlog is stable</span>
                  </>
                )}
              </p>
            </section>
          </div>
        </article>
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
