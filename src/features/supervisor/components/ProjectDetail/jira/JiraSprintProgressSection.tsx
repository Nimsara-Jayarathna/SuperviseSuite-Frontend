import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
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

function sprintOptionKey(sprint: JiraSprintSummary): string {
  if (sprint.sprintId !== null) {
    return `id:${sprint.sprintId}`;
  }
  return `meta:${sprint.sprintName ?? 'unknown'}|${sprint.startDate ?? 'none'}|${sprint.endDate ?? 'none'}`;
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
  const activeSprint = progress?.activeSprint ?? null;
  const recentSprints = progress?.recentSprints ?? [];
  const selectableSprints = useMemo(() => {
    const combined = [
      ...(activeSprint ? [activeSprint] : []),
      ...recentSprints,
    ];
    const seen = new Set<string>();

    return combined.filter((sprint) => {
      const key = sprintOptionKey(sprint);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [activeSprint, recentSprints]);
  const [selectedSprintKey, setSelectedSprintKey] = useState<string>('');

  useEffect(() => {
    if (selectableSprints.length === 0) {
      setSelectedSprintKey('');
      return;
    }

    const hasCurrent = selectableSprints.some(
      (sprint) => sprintOptionKey(sprint) === selectedSprintKey,
    );
    if (!hasCurrent) {
      const defaultSprint = activeSprint ?? selectableSprints[0];
      setSelectedSprintKey(sprintOptionKey(defaultSprint));
    }
  }, [activeSprint, selectableSprints, selectedSprintKey]);

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

  const selectedSprint = selectableSprints.find((sprint) => sprintOptionKey(sprint) === selectedSprintKey)
    ?? activeSprint
    ?? null;
  const isViewingCurrentSprint =
    selectedSprint !== null &&
    activeSprint !== null &&
    sprintOptionKey(selectedSprint) === sprintOptionKey(activeSprint);
  const issueCompletionRatio =
    selectedSprint && selectedSprint.issuesTotal > 0
      ? selectedSprint.issuesDone / selectedSprint.issuesTotal
      : selectedSprint
        ? selectedSprint.completionPercent / 100
        : 0;
  const pointsCompletionRatio =
    selectedSprint && selectedSprint.sprintPointsAvailable && selectedSprint.sprintPointsTotal > 0
      ? selectedSprint.sprintPointsDone / selectedSprint.sprintPointsTotal
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
  const sprintStart = selectedSprint?.startDate ? new Date(selectedSprint.startDate) : null;
  const sprintEnd = selectedSprint?.endDate ? new Date(selectedSprint.endDate) : null;
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
    selectedSprint && elapsedSprintDays > 0
      ? Math.min(
          selectedSprint.issuesTotal,
          Math.round((selectedSprint.issuesDone / elapsedSprintDays) * totalSprintDays),
        )
      : (selectedSprint?.issuesDone ?? 0);

  const sprintVelocitySeries = progress.recentSprints
    .slice(0, 3)
    .reverse()
    .map((sprint, index) => ({
      id: sprint.sprintId ?? index,
      sprint: sprint.sprintName?.trim() || `Sprint ${index}`,
      committed:
        sprint.sprintPointsTotal > 0
          ? Number(sprint.sprintPointsTotal.toFixed(1))
          : Number(sprint.issuesTotal.toFixed(1)),
      completed:
        sprint.sprintPointsDone > 0
          ? Number(sprint.sprintPointsDone.toFixed(1))
          : Number(sprint.issuesDone.toFixed(1)),
    }));
  const sprintCompletedAverage =
    sprintVelocitySeries.length > 0
      ? sprintVelocitySeries.reduce((sum, item) => sum + item.completed, 0) /
        sprintVelocitySeries.length
      : 0;
  const velocityWeeks = [...progress.velocityWeeks].sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime(),
  );
  const latestVelocityWeek = velocityWeeks.length > 0 ? velocityWeeks[velocityWeeks.length - 1] : null;
  const previousVelocityWeek = velocityWeeks.length > 1 ? velocityWeeks[velocityWeeks.length - 2] : null;

  const thisWeekClosed = latestVelocityWeek?.resolved ?? null;
  const thisWeekOpened = latestVelocityWeek?.created ?? null;
  const thisWeekNet = latestVelocityWeek ? latestVelocityWeek.resolved - latestVelocityWeek.created : null;
  const thisWeekAvgCycleDays = latestVelocityWeek?.averageCycleDays ?? null;

  const previousWeekClosed = previousVelocityWeek?.resolved ?? null;
  const previousWeekOpened = previousVelocityWeek?.created ?? null;
  const previousWeekNet = previousVelocityWeek
    ? previousVelocityWeek.resolved - previousVelocityWeek.created
    : null;
  const previousWeekAvgCycleDays = previousVelocityWeek?.averageCycleDays ?? null;

  const thisWeekVsPrevious = {
    closed:
      thisWeekClosed !== null && previousWeekClosed !== null
        ? thisWeekClosed - previousWeekClosed
        : null,
    opened:
      thisWeekOpened !== null && previousWeekOpened !== null
        ? thisWeekOpened - previousWeekOpened
        : null,
    net: thisWeekNet !== null && previousWeekNet !== null ? thisWeekNet - previousWeekNet : null,
    avgCycle:
      thisWeekAvgCycleDays !== null && previousWeekAvgCycleDays !== null
        ? thisWeekAvgCycleDays - previousWeekAvgCycleDays
        : null,
  };

  const netNegativeStreak = velocityWeeks
    .slice()
    .reverse()
    .reduce((streak, week) => {
      if (streak.stop) {
        return streak;
      }
      if (week.resolved - week.created < 0) {
        return { count: streak.count + 1, stop: false };
      }
      return { ...streak, stop: true };
    }, { count: 0, stop: false as boolean }).count;

  const worseningScores = {
    closed: thisWeekVsPrevious.closed === null ? 0 : Math.max(0, -thisWeekVsPrevious.closed),
    opened: thisWeekVsPrevious.opened === null ? 0 : Math.max(0, thisWeekVsPrevious.opened),
    net: thisWeekVsPrevious.net === null ? 0 : Math.max(0, -thisWeekVsPrevious.net),
    avgCycle: thisWeekVsPrevious.avgCycle === null ? 0 : Math.max(0, thisWeekVsPrevious.avgCycle),
  };

  const worstMetric = (Object.entries(worseningScores) as Array<[keyof typeof worseningScores, number]>)
    .reduce<{ key: keyof typeof worseningScores | null; score: number }>(
      (worst, [key, score]) => (score > worst.score ? { key, score } : worst),
      { key: null, score: 0 },
    );

  const weeklyInsight = (() => {
    if (previousVelocityWeek === null) {
      return 'Need more Jira history for comparison insight.';
    }
    if (worstMetric.key === null) {
      return 'Flow remained stable vs last week across throughput and cycle time.';
    }
    if (worstMetric.key === 'net') {
      return `Intake exceeding delivery for ${Math.max(1, netNegativeStreak)} consecutive week${netNegativeStreak === 1 ? '' : 's'}.`;
    }
    if (worstMetric.key === 'avgCycle') {
      const increase = thisWeekVsPrevious.avgCycle ?? 0;
      return `Cycle time up ${increase.toFixed(1)}d vs last week - review in-progress blockers.`;
    }
    if (worstMetric.key === 'opened') {
      const increase = thisWeekVsPrevious.opened ?? 0;
      return `New intake rose by ${Math.round(increase)} issue${Math.round(increase) === 1 ? '' : 's'} vs last week.`;
    }
    const drop = Math.abs(thisWeekVsPrevious.closed ?? 0);
    return `Closed volume dropped by ${Math.round(drop)} issue${Math.round(drop) === 1 ? '' : 's'} vs last week.`;
  })();

  const thisWeekOpenedCount = thisWeekOpened ?? 0;
  const thisWeekClosedCount = thisWeekClosed ?? 0;
  const thisWeekClosedCapped = Math.min(thisWeekClosedCount, thisWeekOpenedCount);
  const thisWeekNotYetCount = Math.max(0, thisWeekOpenedCount - thisWeekClosedCount);
  const thisWeekClosedPercent =
    thisWeekOpenedCount > 0
      ? clampPercent(Math.round((thisWeekClosedCapped / thisWeekOpenedCount) * 100))
      : 0;
  const latestVelocitySprint =
    sprintVelocitySeries.length > 0
      ? sprintVelocitySeries[sprintVelocitySeries.length - 1]
      : null;
  const activeSprintAddedIssues = Math.max(
    0,
    (activeSprint?.issuesTotal ?? 0) - Math.max(0, activeSprint?.sprintStartIssueCount ?? 0),
  );
  const velocityDivergence = latestVelocitySprint
    ? Math.max(0, latestVelocitySprint.committed - latestVelocitySprint.completed)
    : 0;
  const velocityDivergenceInsight = latestVelocitySprint
    ? velocityDivergence > 0
      ? `Committed vs completed diverged in ${latestVelocitySprint.sprint} (${Math.round(latestVelocitySprint.committed)} committed, ${Math.round(latestVelocitySprint.completed)} completed). Factor scope change (+${activeSprintAddedIssues} mid-sprint issues) as the likely cause.`
      : `Committed vs completed remained aligned in ${latestVelocitySprint.sprint} (${Math.round(latestVelocitySprint.committed)} committed, ${Math.round(latestVelocitySprint.completed)} completed).`
    : 'Committed vs completed trend is unavailable until recent sprint data is synced.';

  return (
    <section id="jira-sprint-progress" className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="inline-flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-wide text-slate-900">Sprint progress</h2>
        </div>
        <p className="text-sm text-slate-600">Delivery velocity and sprint completion trend</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-2">
          <article className="rounded-lg border-[0.5px] border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="mb-3">
              <label
                htmlFor="jira-sprint-selector"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Sprint selector
              </label>
              <select
                id="jira-sprint-selector"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-colors hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={selectedSprintKey}
                onChange={(event) => setSelectedSprintKey(event.target.value)}
              >
                {selectableSprints.map((sprint) => {
                  const optionKey = sprintOptionKey(sprint);
                  const isCurrent =
                    activeSprint !== null && sprintOptionKey(activeSprint) === optionKey;
                  return (
                    <option key={optionKey} value={optionKey}>
                      {isCurrent ? 'Current: ' : ''}
                      {sprint.sprintName?.trim() || 'Unnamed sprint'}
                    </option>
                  );
                })}
              </select>
            </div>
            {selectedSprint ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {isViewingCurrentSprint ? 'Active sprint' : 'Selected sprint'}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {selectedSprint.sprintName?.trim() || 'Unnamed sprint'}
                      </p>
                      {isViewingCurrentSprint && daysLeft !== null ? (
                        <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                        </span>
                      ) : selectedSprint.sprintState ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-700">
                          {selectedSprint.sprintState}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatSprintRange(selectedSprint.startDate, selectedSprint.endDate)}
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
                    {selectedSprint.issuesDone} done of {selectedSprint.issuesTotal} issues
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
                  {selectedSprint.sprintPointsAvailable ? (
                    <p className="mt-1 text-xs text-slate-600">
                      {selectedSprint.sprintPointsDone.toFixed(1)} /{' '}
                      {selectedSprint.sprintPointsTotal.toFixed(1)} SP done
                    </p>
                  ) : (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      SP data unavailable
                    </p>
                  )}

                  <p className="mt-3 text-xs text-slate-500">
                    Est. {projectedIssueDoneCount}/{selectedSprint.issuesTotal} issues by sprint end
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No active sprint detected. Recent sprint history is still shown below.
              </div>
            )}
          </article>

          <section className="rounded-lg border-[0.5px] border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <h3 className="text-sm font-semibold text-slate-900">This week</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  {
                    label: 'Closed',
                    current: thisWeekClosed,
                    previous: previousWeekClosed,
                    delta: thisWeekVsPrevious.closed,
                    currentLabel: (value: number | null) => (value === null ? 'N/A' : `${value}`),
                    previousLabel: (value: number | null) => (value === null ? 'N/A last week' : `${value} last week`),
                    isImproving: (value: number) => value > 0,
                    currentColor: '#059669',
                  },
                  {
                    label: 'Opened',
                    current: thisWeekOpened,
                    previous: previousWeekOpened,
                    delta: thisWeekVsPrevious.opened,
                    currentLabel: (value: number | null) => (value === null ? 'N/A' : `${value}`),
                    previousLabel: (value: number | null) => (value === null ? 'N/A last week' : `${value} last week`),
                    isImproving: (value: number) => value < 0,
                    currentColor: '#0F172A',
                  },
                  {
                    label: 'Net',
                    current: thisWeekNet,
                    previous: previousWeekNet,
                    delta: thisWeekVsPrevious.net,
                    currentLabel: (value: number | null) => {
                      if (value === null) {
                        return 'N/A';
                      }
                      return value > 0 ? `+${value}` : `${value}`;
                    },
                    previousLabel: (value: number | null) => {
                      if (value === null) {
                        return 'N/A last week';
                      }
                      return `${value > 0 ? '+' : ''}${value} last week`;
                    },
                    isImproving: (value: number) => value > 0,
                    currentColor: thisWeekNet !== null && thisWeekNet < 0 ? '#DC2626' : '#059669',
                  },
                  {
                    label: 'Avg cycle',
                    current: thisWeekAvgCycleDays,
                    previous: previousWeekAvgCycleDays,
                    delta: thisWeekVsPrevious.avgCycle,
                    currentLabel: (value: number | null) => (value === null ? 'N/A' : `${value.toFixed(1)}d`),
                    previousLabel: (value: number | null) => (value === null ? 'N/A last week' : `${value.toFixed(1)}d last week`),
                    isImproving: (value: number) => value < 0,
                    currentColor: '#0F172A',
                  },
                ].map((metric) => {
                  const delta = metric.delta;
                  const hasDelta = delta !== null;
                  const isImproving = hasDelta && metric.isImproving(delta);
                  const isWorsening = hasDelta && delta !== 0 && !isImproving;
                  const arrow = !hasDelta || delta === 0 ? '→' : delta > 0 ? '↑' : '↓';
                  const deltaLabel = !hasDelta
                    ? 'No prior week'
                    : delta === 0
                      ? `${arrow} 0`
                      : `${arrow} ${delta > 0 ? '+' : ''}${metric.label === 'Avg cycle' ? `${delta.toFixed(1)}d` : Math.round(delta)}`;
                  return (
                    <div
                      key={metric.label}
                      className="grid min-h-[112px] grid-rows-[auto_auto_auto_auto] content-start rounded-md px-3 py-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm"
                      style={{
                        background: 'var(--color-background-secondary)',
                        border: '0.5px solid var(--color-border-tertiary)',
                        borderRadius: 'var(--border-radius-md)',
                      }}
                    >
                      <span className="leading-none" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {metric.label}
                      </span>
                      <span className="mt-1 font-semibold leading-none" style={{ fontSize: 20, color: metric.currentColor }}>
                        {metric.currentLabel(metric.current)}
                      </span>
                      <span className="mt-1 text-[11px] leading-none text-slate-500">{metric.previousLabel(metric.previous)}</span>
                      <span
                        className="mt-1 text-[10px] font-semibold leading-none"
                        style={{
                          color: !hasDelta
                            ? '#64748B'
                            : isWorsening
                              ? '#DC2626'
                              : isImproving
                                ? '#059669'
                                : '#475569',
                        }}
                      >
                        {deltaLabel}
                      </span>
                    </div>
                  );
                })}
            </div>

            {latestVelocityWeek ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Opened issues</span>
                  <span className="font-semibold text-slate-800">{thisWeekOpenedCount}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="flex h-full w-full">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${thisWeekClosedPercent}%` }}
                      aria-hidden
                    />
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${100 - thisWeekClosedPercent}%` }}
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    <span className="font-semibold text-emerald-700">{thisWeekClosedCount}</span> closed
                  </span>
                  <span>
                    <span className="font-semibold text-rose-700">{thisWeekNotYetCount}</span> not yet
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Weekly opened/closed bar appears once weekly data is available.
              </div>
            )}

            <p className="mt-3 text-xs font-medium text-slate-700">{weeklyInsight}</p>
          </section>
        </div>

        <section className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition-all hover:border-slate-300 hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Sprint velocity</h3>
              <p className="text-xs font-semibold text-slate-700">
                Avg completed: {Math.round(sprintCompletedAverage)} SP/sprint
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-600">Use this trend as the next sprint planning baseline.</p>

            {sprintVelocitySeries.length > 0 ? (
              <div className="mt-3">
                <div className="h-36 rounded-lg border border-slate-200 bg-white px-2 py-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sprintVelocitySeries}
                      margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                      barCategoryGap="30%"
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#D3D1C7" vertical={false} />
                      <XAxis
                        dataKey="sprint"
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
                        formatter={(value, name) => [
                          `${Number(value ?? 0).toFixed(1)} SP`,
                          name === 'committed' ? 'Committed' : 'Completed',
                        ]}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: '0.5px solid #D3D1C7',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      />
                      <ReferenceLine
                        y={Number(sprintCompletedAverage.toFixed(1))}
                        stroke="#EF9F27"
                        strokeDasharray="4 3"
                        label={{
                          value: `Avg completed: ${Math.round(sprintCompletedAverage)} SP/sprint`,
                          position: 'right',
                          fill: '#5F5E5A',
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="committed"
                        name="Committed"
                        fill="#85B7EB"
                        stroke="#85B7EB"
                        radius={[4, 4, 0, 0]}
                      >
                        <LabelList
                          dataKey="committed"
                          position="top"
                          style={{ fontWeight: 500, fontSize: 12, fill: '#5F5E5A' }}
                        />
                      </Bar>
                      <Bar
                        dataKey="completed"
                        name="Completed"
                        fill="#185FA5"
                        stroke="#185FA5"
                        radius={[4, 4, 0, 0]}
                      >
                        <LabelList
                          dataKey="completed"
                          position="top"
                          style={{ fontWeight: 500, fontSize: 12, fill: '#0C447C' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  {velocityDivergenceInsight}
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-600">
                Sprint velocity is not available yet.
              </div>
            )}
          </section>

      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
          <h3 className="text-sm font-semibold text-slate-900">Recent sprints</h3>
          {progress.recentSprints.length > 0 ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full table-fixed text-xs">
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[30%]" />
                  <col className="w-[14%]" />
                  <col className="w-[24%]" />
                </colgroup>
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Sprint</th>
                    <th className="px-3 py-2 text-left font-semibold">Range</th>
                    <th className="px-3 py-2 text-left font-semibold">State</th>
                    <th className="px-3 py-2 text-left font-semibold">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.recentSprints.slice(0, 3).map((sprint) => {
                    const completion = Math.max(0, Math.min(100, Math.round(sprint.completionPercent)));
                    return (
                      <tr
                        key={`${sprint.sprintId ?? 'unknown'}-${sprint.sprintName ?? 'sprint'}`}
                        className="border-t border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          <span className="block truncate">{sprint.sprintName?.trim() || 'Unnamed sprint'}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <span className="block truncate">{formatSprintRange(sprint.startDate, sprint.endDate)}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-700">
                            {sprint.sprintState ?? 'unknown'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-1.5 rounded-full bg-emerald-500"
                                style={{ width: `${completion}%` }}
                                aria-hidden
                              />
                            </div>
                            <span className="shrink-0 font-semibold tabular-nums text-slate-700">{completion}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
