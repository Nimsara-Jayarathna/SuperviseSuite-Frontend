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
import { Select } from '@/components/ui/Select';
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
  const [isVelocityChartReady, setIsVelocityChartReady] = useState(false);
  const activeSprint = progress?.activeSprint ?? null;
  const selectableSprints = useMemo(() => {
    const recentSprints = progress?.recentSprints ?? [];
    const combined = [...(activeSprint ? [activeSprint] : []), ...recentSprints];
    const seen = new Set<string>();

    return combined.filter((sprint) => {
      const key = sprintOptionKey(sprint);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [activeSprint, progress?.recentSprints]);
  const [selectedSprintKey, setSelectedSprintKey] = useState<string>('');

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setIsVelocityChartReady(true);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, []);

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

  const selectedSprint =
    selectableSprints.find((sprint) => sprintOptionKey(sprint) === selectedSprintKey) ??
    activeSprint ??
    null;
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
    .slice(0, 4)
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
  const latestVelocityWeek =
    velocityWeeks.length > 0 ? velocityWeeks[velocityWeeks.length - 1] : null;
  const previousVelocityWeek =
    velocityWeeks.length > 1 ? velocityWeeks[velocityWeeks.length - 2] : null;

  const thisWeekClosed = latestVelocityWeek?.resolved ?? null;
  const thisWeekOpened = latestVelocityWeek?.created ?? null;
  const thisWeekNet = latestVelocityWeek
    ? latestVelocityWeek.resolved - latestVelocityWeek.created
    : null;
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
    .reduce(
      (streak, week) => {
        if (streak.stop) {
          return streak;
        }
        if (week.resolved - week.created < 0) {
          return { count: streak.count + 1, stop: false };
        }
        return { ...streak, stop: true };
      },
      { count: 0, stop: false as boolean },
    ).count;

  const worseningScores = {
    closed: thisWeekVsPrevious.closed === null ? 0 : Math.max(0, -thisWeekVsPrevious.closed),
    opened: thisWeekVsPrevious.opened === null ? 0 : Math.max(0, thisWeekVsPrevious.opened),
    net: thisWeekVsPrevious.net === null ? 0 : Math.max(0, -thisWeekVsPrevious.net),
    avgCycle: thisWeekVsPrevious.avgCycle === null ? 0 : Math.max(0, thisWeekVsPrevious.avgCycle),
  };

  const worstMetric = (
    Object.entries(worseningScores) as Array<[keyof typeof worseningScores, number]>
  ).reduce<{ key: keyof typeof worseningScores | null; score: number }>(
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
    sprintVelocitySeries.length > 0 ? sprintVelocitySeries[sprintVelocitySeries.length - 1] : null;
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 border-t border-slate-200 pt-4">
        <div className="inline-flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-wide text-slate-900">Sprint progress</h2>
        </div>
        <p className="text-sm text-slate-600">Delivery velocity and sprint completion trend</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-2">
          <article className="group rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
            <div className="mb-3">
              <label
                htmlFor="jira-sprint-selector"
                className="mb-1.5 block text-sm font-bold text-slate-700"
              >
                Sprint
              </label>
              <Select
                id="jira-sprint-selector"
                triggerVariant="pill"
                className="w-full"
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
              </Select>
            </div>
            {selectedSprint ? (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      {isViewingCurrentSprint ? 'Active sprint' : 'Selected sprint'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-bold text-slate-900">
                        {selectedSprint.sprintName?.trim() || 'Unnamed sprint'}
                      </p>
                      {isViewingCurrentSprint && daysLeft !== null ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                        </span>
                      ) : selectedSprint.sprintState ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
                          {selectedSprint.sprintState}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatSprintRange(selectedSprint.startDate, selectedSprint.endDate)}
                    </p>
                  </div>

                  {/* Health ring */}
                  <div className="flex shrink-0 flex-col items-center gap-0.5">
                    <svg
                      viewBox="0 0 48 48"
                      className="h-12 w-12"
                      role="img"
                      aria-label={`Sprint health score ${sprintHealthScore}%`}
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r={compactRingRadius}
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth="5"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r={compactRingRadius}
                        fill="none"
                        stroke={
                          sprintHealthScore >= 70
                            ? '#10B981'
                            : sprintHealthScore >= 40
                              ? '#F59E0B'
                              : '#EF4444'
                        }
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={compactRingCircumference}
                        strokeDashoffset={compactRingStrokeOffset}
                        transform="rotate(-90 24 24)"
                      />
                      <text
                        x="24"
                        y="28"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill="#1E293B"
                        fontFamily="inherit"
                      >
                        {sprintHealthScore}
                      </text>
                    </svg>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 transition-colors duration-300 group-hover:text-slate-600">
                      health
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Issue completion */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Issue completion</span>
                      <span className="text-xs font-bold tabular-nums text-slate-800">
                        {issueCompletionPercent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${issueCompletionPercent}%` }}
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-emerald-600">
                        {selectedSprint.issuesDone}
                      </span>{' '}
                      of {selectedSprint.issuesTotal} issues done
                    </p>
                  </div>

                  {/* SP completion */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Story points</span>
                      <span className="text-xs font-bold tabular-nums text-slate-800">
                        {pointsCompletionPercent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${pointsCompletionPercent}%` }}
                        aria-hidden
                      />
                    </div>
                    {selectedSprint.sprintPointsAvailable ? (
                      <p className="mt-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-indigo-600">
                          {selectedSprint.sprintPointsDone.toFixed(1)}
                        </span>{' '}
                        / {selectedSprint.sprintPointsTotal.toFixed(1)} SP done
                      </p>
                    ) : (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        SP data unavailable
                      </p>
                    )}
                  </div>

                  {/* Projection */}
                  <p className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
                    Projected:{' '}
                    <span className="font-semibold text-slate-700">
                      {projectedIssueDoneCount}/{selectedSprint.issuesTotal}
                    </span>{' '}
                    issues by sprint end
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                No active sprint detected. Recent sprint history is still shown below.
              </div>
            )}
          </article>

          <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
            <div className="mb-3 flex items-center gap-2">
              <p className="text-sm font-bold text-slate-700">This week</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  label: 'Closed',
                  current: thisWeekClosed,
                  previous: previousWeekClosed,
                  delta: thisWeekVsPrevious.closed,
                  currentLabel: (value: number | null) => (value === null ? '—' : `${value}`),
                  previousLabel: (value: number | null) =>
                    value === null ? '— last wk' : `${value} last wk`,
                  isImproving: (value: number) => value > 0,
                  valueColor: 'text-emerald-600',
                },
                {
                  label: 'Opened',
                  current: thisWeekOpened,
                  previous: previousWeekOpened,
                  delta: thisWeekVsPrevious.opened,
                  currentLabel: (value: number | null) => (value === null ? '—' : `${value}`),
                  previousLabel: (value: number | null) =>
                    value === null ? '— last wk' : `${value} last wk`,
                  isImproving: (value: number) => value < 0,
                  valueColor: 'text-slate-800',
                },
                {
                  label: 'Net',
                  current: thisWeekNet,
                  previous: previousWeekNet,
                  delta: thisWeekVsPrevious.net,
                  currentLabel: (value: number | null) => {
                    if (value === null) return '—';
                    return value > 0 ? `+${value}` : `${value}`;
                  },
                  previousLabel: (value: number | null) => {
                    if (value === null) return '— last wk';
                    return `${value > 0 ? '+' : ''}${value} last wk`;
                  },
                  isImproving: (value: number) => value > 0,
                  valueColor:
                    thisWeekNet !== null && thisWeekNet < 0 ? 'text-red-600' : 'text-emerald-600',
                },
                {
                  label: 'Avg cycle',
                  current: thisWeekAvgCycleDays,
                  previous: previousWeekAvgCycleDays,
                  delta: thisWeekVsPrevious.avgCycle,
                  currentLabel: (value: number | null) =>
                    value === null ? '—' : `${value.toFixed(1)}d`,
                  previousLabel: (value: number | null) =>
                    value === null ? '— last wk' : `${value.toFixed(1)}d last wk`,
                  isImproving: (value: number) => value < 0,
                  valueColor: 'text-slate-800',
                },
              ].map((metric) => {
                const delta = metric.delta;
                const hasDelta = delta !== null;
                const isImproving = hasDelta && metric.isImproving(delta);
                const isWorsening = hasDelta && delta !== 0 && !isImproving;

                const deltaSign = !hasDelta || delta === 0 ? '' : delta > 0 ? '+' : '';
                const deltaValue = !hasDelta
                  ? null
                  : metric.label === 'Avg cycle'
                    ? `${deltaSign}${delta.toFixed(1)}d`
                    : `${deltaSign}${Math.round(delta)}`;

                const deltaBadgeClass =
                  !hasDelta || delta === 0
                    ? 'bg-slate-100 text-slate-500'
                    : isImproving
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : isWorsening
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-slate-100 text-slate-500';

                return (
                  <div
                    key={metric.label}
                    className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm"
                  >
                    {/* Label */}
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      {metric.label}
                    </span>

                    {/* Value */}
                    <span
                      className={`text-xl font-bold tabular-nums leading-none ${metric.valueColor}`}
                    >
                      {metric.currentLabel(metric.current)}
                    </span>

                    {/* Previous */}
                    <span className="text-[10px] text-slate-400">
                      {metric.previousLabel(metric.previous)}
                    </span>

                    {/* Delta badge */}
                    <span
                      className={`mt-auto self-start rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${deltaBadgeClass}`}
                    >
                      {deltaValue === null
                        ? 'No prior wk'
                        : deltaValue === '+0' || deltaValue === '0' || deltaValue === '-0'
                          ? '→ No change'
                          : deltaValue}
                    </span>
                  </div>
                );
              })}
            </div>

            {latestVelocityWeek ? (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Opened this week</span>
                  <span className="text-xs font-bold tabular-nums text-slate-700">
                    {thisWeekOpenedCount}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="flex h-full w-full">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${thisWeekClosedPercent}%` }}
                      aria-hidden
                    />
                    <div
                      className="h-full bg-rose-400 transition-all duration-500"
                      style={{ width: `${100 - thisWeekClosedPercent}%` }}
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-emerald-600">
                      {thisWeekClosedCount}
                    </span>{' '}
                    closed
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span className="font-semibold text-rose-600">{thisWeekNotYetCount}</span> not
                    yet
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                Weekly opened/closed bar appears once weekly data is available.
              </div>
            )}

            {/* Weekly insight callout */}
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <p className="text-[11px] font-medium text-slate-600">{weeklyInsight}</p>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
            <h3 className="text-sm font-semibold text-slate-900">Sprint velocity</h3>
            <p className="text-xs font-semibold text-slate-700">
              Avg completed: {Math.round(sprintCompletedAverage)} SP/sprint
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Use this trend as the next sprint planning baseline.
          </p>

          {sprintVelocitySeries.length > 0 ? (
            <div className="mt-3 min-w-0">
              <div className="h-44 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 sm:h-36">
                {/* Delay one frame so the container has a measurable box (prevents -1 x -1 warning). */}
                {isVelocityChartReady ? (
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
                          String(name).toLowerCase() === 'committed' ? 'Committed' : 'Completed',
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
                ) : (
                  <div className="h-full w-full animate-pulse rounded-md bg-slate-50" />
                )}
              </div>

              <p className="mt-2 break-words text-xs leading-relaxed text-slate-600">
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
            <div className="mt-3 flex flex-col rounded-lg border border-slate-200 sm:block sm:overflow-hidden">
              <table className="hidden w-full table-fixed text-xs sm:table">
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
                  {progress.recentSprints.slice(0, 4).map((sprint) => {
                    const completion = Math.max(
                      0,
                      Math.min(100, Math.round(sprint.completionPercent)),
                    );
                    return (
                      <tr
                        key={`${sprint.sprintId ?? 'unknown'}-${sprint.sprintName ?? 'sprint'}`}
                        className="border-t border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 font-semibold text-slate-900">
                          <span className="block truncate">
                            {sprint.sprintName?.trim() || 'Unnamed sprint'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <span className="block truncate">
                            {formatSprintRange(sprint.startDate, sprint.endDate)}
                          </span>
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
                            <span className="shrink-0 font-semibold tabular-nums text-slate-700">
                              {completion}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex flex-col divide-y divide-slate-100 sm:hidden">
                {progress.recentSprints.slice(0, 4).map((sprint) => {
                  const completion = Math.max(
                    0,
                    Math.min(100, Math.round(sprint.completionPercent)),
                  );
                  return (
                    <div
                      key={`mob-${sprint.sprintId ?? 'unknown'}-${sprint.sprintName ?? 'sprint'}`}
                      className="p-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <span className="truncate font-semibold leading-tight text-slate-900">
                          {sprint.sprintName?.trim() || 'Unnamed sprint'}
                        </span>
                        <span className="inline-flex shrink-0 leading-none rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-700">
                          {sprint.sprintState ?? 'unknown'}
                        </span>
                      </div>
                      <div className="mb-2 truncate text-[11px] text-slate-500">
                        {formatSprintRange(sprint.startDate, sprint.endDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500"
                            style={{ width: `${completion}%` }}
                            aria-hidden
                          />
                        </div>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700">
                          {completion}% progress
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
