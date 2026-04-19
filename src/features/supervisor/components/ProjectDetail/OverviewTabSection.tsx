import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Flag, Target } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FIELD_LIMITS, LIFECYCLE_OPTIONS, dateFormatter } from '../../projectDetails.shared';
import type { OverviewState } from '../../hooks/useProjectDetailsPageState';
import type { SupervisorProjectLifecycle } from '../../types';
import type { SupervisorProjectDetail } from '../../types';

type OverviewTabSectionProps = {
  project: SupervisorProjectDetail;
  overview: OverviewState;
};

type MilestoneDetail = SupervisorProjectDetail['milestones'][number];
type StatusBadgeTone = 'student' | 'supervisor' | 'success' | 'warning' | 'danger' | 'neutral';

type MilestoneSummary = {
  orderedMilestones: MilestoneDetail[];
  total: number;
  active: number;
  completed: number;
  inProgress: number;
  planned: number;
  missed: number;
  cancelled: number;
  overdueOpen: number;
  dueSoon: number;
  chronologyViolations: number;
  riskLevel: string;
  nextUpcoming: MilestoneDetail | null;
  latestCompleted: MilestoneDetail | null;
  highestRiskMilestone: MilestoneDetail | null;
};

const OPEN_STATUSES = new Set<MilestoneDetail['status']>(['PLANNED', 'IN_PROGRESS']);
const RISK_LOW = 'LOW';
const RISK_MEDIUM = 'MEDIUM';
const RISK_HIGH = 'HIGH';

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return new Date(year, month - 1, day);
}

function getMilestoneTone(status: MilestoneDetail['status']): StatusBadgeTone {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'student';
    case 'MISSED':
      return 'danger';
    case 'CANCELLED':
      return 'neutral';
    case 'PLANNED':
    default:
      return 'warning';
  }
}

function getRiskTone(riskLevel: string): StatusBadgeTone {
  if (riskLevel === RISK_HIGH) {
    return 'danger';
  }
  if (riskLevel === RISK_MEDIUM) {
    return 'warning';
  }
  return 'success';
}

function buildMilestoneSummary(project: SupervisorProjectDetail): MilestoneSummary {
  const orderedMilestones = [...project.milestones].sort((left, right) => {
    if (left.sequenceNo !== right.sequenceNo) {
      return left.sequenceNo - right.sequenceNo;
    }
    return parseLocalDate(left.dueDate).getTime() - parseLocalDate(right.dueDate).getTime();
  });

  const statusCounts: Record<MilestoneDetail['status'], number> = {
    PLANNED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    MISSED: 0,
    CANCELLED: 0,
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueSoonBoundary = new Date(now);
  dueSoonBoundary.setDate(dueSoonBoundary.getDate() + 7);

  let overdueOpen = 0;
  let dueSoonComputed = 0;
  let chronologyViolations = 0;
  let highestRiskMilestone: MilestoneDetail | null = null;

  for (const milestone of orderedMilestones) {
    statusCounts[milestone.status] += 1;

    if (milestone.isChronologyViolation) {
      chronologyViolations += 1;
    }

    const dueDate = parseLocalDate(milestone.dueDate);
    const isOpen = OPEN_STATUSES.has(milestone.status);
    const isOverdue = isOpen && (milestone.isOverdue === true || dueDate.getTime() < now.getTime());

    if (isOverdue) {
      overdueOpen += 1;
      if (
        highestRiskMilestone === null ||
        parseLocalDate(highestRiskMilestone.dueDate).getTime() > dueDate.getTime()
      ) {
        highestRiskMilestone = milestone;
      }
    }

    if (isOpen && dueDate.getTime() >= now.getTime() && dueDate.getTime() <= dueSoonBoundary.getTime()) {
      dueSoonComputed += 1;
    }
  }

  const nextUpcoming =
    orderedMilestones.find((milestone) => {
      if (!OPEN_STATUSES.has(milestone.status)) {
        return false;
      }
      const dueDate = parseLocalDate(milestone.dueDate);
      return dueDate.getTime() >= now.getTime();
    }) ?? null;

  const latestCompleted =
    [...orderedMilestones]
      .reverse()
      .find((milestone) => milestone.status === 'COMPLETED') ?? null;

  let derivedRiskLevel = RISK_LOW;
  if (chronologyViolations > 0 || overdueOpen >= 2) {
    derivedRiskLevel = RISK_HIGH;
  } else if (overdueOpen === 1 || dueSoonComputed >= 2) {
    derivedRiskLevel = RISK_MEDIUM;
  }

  return {
    orderedMilestones,
    total: orderedMilestones.length,
    active: orderedMilestones.length - statusCounts.CANCELLED,
    completed: statusCounts.COMPLETED,
    inProgress: statusCounts.IN_PROGRESS,
    planned: statusCounts.PLANNED,
    missed: statusCounts.MISSED,
    cancelled: statusCounts.CANCELLED,
    overdueOpen,
    dueSoon: project.milestoneInsights?.dueSoonCount ?? dueSoonComputed,
    chronologyViolations,
    riskLevel: project.milestoneInsights?.timelineRiskLevel ?? derivedRiskLevel,
    nextUpcoming,
    latestCompleted,
    highestRiskMilestone,
  };
}

function buildHealthBrief(healthNote: string | null, summary: MilestoneSummary) {
  const manualNote = healthNote?.trim();
  if (manualNote) {
    return {
      text: manualNote,
      autoGenerated: false,
    };
  }

  if (summary.total === 0) {
    return {
      text: 'No manual health note yet. Add dated milestones to start measuring delivery confidence and risk.',
      autoGenerated: true,
    };
  }

  if (summary.overdueOpen > 0) {
    return {
      text: `${summary.overdueOpen} open milestone(s) are overdue. Delivery recovery is required before adding new scope.`,
      autoGenerated: true,
    };
  }

  if (summary.riskLevel === RISK_HIGH) {
    return {
      text: 'Timeline risk is high due to sequencing or deadline pressure. Review milestone order and dependencies in the next checkpoint.',
      autoGenerated: true,
    };
  }

  if (summary.riskLevel === RISK_MEDIUM) {
    return {
      text: `Schedule pressure is building with ${summary.dueSoon} milestone(s) due in the next 7 days. Confirm owners and acceptance criteria now.`,
      autoGenerated: true,
    };
  }

  if (summary.active > 0 && summary.completed === summary.active) {
    return {
      text: 'All active milestones are completed. Capture retrospective notes and close the lifecycle when stakeholders approve.',
      autoGenerated: true,
    };
  }

  return {
    text: 'Timeline is currently stable. Keep milestone statuses current after each review to maintain accurate risk signals.',
    autoGenerated: true,
  };
}

function buildFocusItems(project: SupervisorProjectDetail, summary: MilestoneSummary): string[] {
  if (summary.total === 0) {
    return [
      'Define at least 3 milestones with due dates so delivery health can be tracked week by week.',
      'Assign a project leader to own delivery follow-ups and unblock milestone owners quickly.',
    ];
  }

  const items: string[] = [];

  if (summary.overdueOpen > 0 && summary.highestRiskMilestone) {
    items.push(
      `Recover "${summary.highestRiskMilestone.title}" first. It is the highest-risk overdue milestone in the current sequence.`,
    );
  }

  if (summary.dueSoon > 0) {
    items.push(
      `Run a readiness check for ${summary.dueSoon} milestone(s) due within 7 days to avoid status churn at the deadline.`,
    );
  }

  if (summary.chronologyViolations > 0) {
    items.push(
      `Fix ${summary.chronologyViolations} milestone chronology issue(s) so downstream deadlines reflect real dependency order.`,
    );
  }

  if (!project.leader) {
    items.push('Assign a project leader to centralize communication and milestone accountability.');
  }

  if (summary.active > 0 && summary.completed === summary.active) {
    items.push('All active milestones are done. Prepare closure evidence and transition lifecycle to COMPLETED.');
  }

  if (items.length === 0) {
    items.push('No urgent blockers detected. Keep milestone updates weekly to preserve this risk level.');
  }

  return items.slice(0, 3);
}

function pickPrimaryMilestone(summary: MilestoneSummary) {
  if (summary.highestRiskMilestone) {
    return { milestone: summary.highestRiskMilestone, label: 'Highest-risk milestone' };
  }

  const inProgressMilestone =
    summary.orderedMilestones.find((milestone) => milestone.status === 'IN_PROGRESS') ?? null;
  if (inProgressMilestone) {
    return { milestone: inProgressMilestone, label: 'Current in-progress milestone' };
  }

  if (summary.nextUpcoming) {
    return { milestone: summary.nextUpcoming, label: 'Next upcoming milestone' };
  }

  if (summary.latestCompleted) {
    return { milestone: summary.latestCompleted, label: 'Most recently completed milestone' };
  }

  const fallback = summary.orderedMilestones[0] ?? null;
  return fallback ? { milestone: fallback, label: 'Primary milestone' } : null;
}

export function OverviewTabSection({ project, overview }: OverviewTabSectionProps) {
  const summary = buildMilestoneSummary(project);
  const healthBrief = buildHealthBrief(project.healthNote, summary);
  const focusItems = buildFocusItems(project, summary);
  const primaryMilestone = pickPrimaryMilestone(summary);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <section className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Project details</h2>
            {!overview.isEditingOverview && (
              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                onClick={overview.startEdit}
              >
                Edit details
              </button>
            )}
          </div>

          {overview.isEditingOverview && overview.overviewForm ? (
            <form className="mt-5 space-y-4" onSubmit={overview.submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Title
                  </span>
                  <input
                    required
                    maxLength={FIELD_LIMITS.title}
                    value={overview.overviewForm.title}
                    onChange={(e) => overview.setField('title', e.target.value)}
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Lifecycle
                  </span>
                  <Select
                    value={overview.overviewForm.lifecycleStatus}
                    onChange={(e) =>
                      overview.setField(
                        'lifecycleStatus',
                        e.target.value as SupervisorProjectLifecycle,
                      )
                    }
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                  >
                    {LIFECYCLE_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Batch
                  </span>
                  <input
                    required
                    maxLength={FIELD_LIMITS.batch}
                    value={overview.overviewForm.batch}
                    onChange={(e) => overview.setField('batch', e.target.value)}
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Semester
                  </span>
                  <input
                    required
                    maxLength={FIELD_LIMITS.semester}
                    value={overview.overviewForm.semester}
                    onChange={(e) => overview.setField('semester', e.target.value)}
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Summary
                  </span>
                  <textarea
                    required
                    maxLength={FIELD_LIMITS.summary}
                    rows={4}
                    value={overview.overviewForm.summary}
                    onChange={(e) => overview.setField('summary', e.target.value)}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Health note
                  </span>
                  <textarea
                    maxLength={FIELD_LIMITS.healthNote}
                    rows={3}
                    value={overview.overviewForm.healthNote}
                    onChange={(e) => overview.setField('healthNote', e.target.value)}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={overview.isSavingOverview}
                  className={buttonStyles({ variant: 'secondary', size: 'md' })}
                  onClick={overview.cancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overview.isSavingOverview || !overview.isOverviewDirty}
                  className={buttonStyles({ variant: 'primary', size: 'md' })}
                >
                  {overview.isSavingOverview ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Batch
                </p>
                <p className="mt-1 font-semibold text-slate-700">{project.batch ?? 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Semester
                </p>
                <p className="mt-1 font-semibold text-slate-700">{project.semester ?? 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Progress
                </p>
                <p className="mt-1 font-semibold text-slate-700">{project.progressPercent ?? 0}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Timeline risk
                </p>
                <div className="mt-1">
                  <StatusBadge tone={getRiskTone(summary.riskLevel)} className="text-[10px] font-black">
                    {summary.riskLevel}
                  </StatusBadge>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Health brief
                </p>
                <div className="mt-2 rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50">
                  {healthBrief.autoGenerated ? (
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                      Auto-generated from milestones
                    </p>
                  ) : null}
                  <p className="text-sm leading-relaxed text-slate-600">
                    {healthBrief.text}
                  </p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Project leader
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {project.leader
                      ? (project.leader.firstName?.[0] || project.leader.email[0]).toUpperCase()
                      : '?'}
                  </div>
                  <p className="font-semibold text-slate-700">
                    {project.leader
                      ? `${project.leader.firstName} ${project.leader.lastName}`
                      : 'No leader assigned'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <h2 className="text-lg font-semibold text-foreground">Delivery intelligence</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Overview signals are generated from milestone status, due dates, and chronology checks.
            Use this block to track delivery pressure before it becomes a missed deadline.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Total milestones</p>
              <p className="mt-2 text-2xl font-semibold text-slate-800">{summary.total}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Completed</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-800">{summary.completed}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-700">Overdue open</p>
              <p className="mt-2 text-2xl font-semibold text-rose-800">{summary.overdueOpen}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Due in 7 days</p>
              <p className="mt-2 text-2xl font-semibold text-amber-800">{summary.dueSoon}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-800">Recommended focus</h3>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
              {focusItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <h2 className="text-lg font-semibold text-foreground">Milestone spotlight</h2>
          {primaryMilestone ? (
            <div className="mt-5">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                  {primaryMilestone.label}
                </p>
                <div className="flex items-center justify-between">
                  <p className="mt-2 font-bold text-slate-800">{primaryMilestone.milestone.title}</p>
                  <StatusBadge
                    tone={getMilestoneTone(primaryMilestone.milestone.status)}
                    className="text-[10px] font-black uppercase"
                  >
                    {primaryMilestone.milestone.status}
                  </StatusBadge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Due {dateFormatter.format(parseLocalDate(primaryMilestone.milestone.dueDate))}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-500 line-clamp-3">
                  {primaryMilestone.milestone.description ?? 'No description provided.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-muted-foreground">No milestones recorded yet.</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <h2 className="text-lg font-semibold text-foreground">Execution signals</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />
              <p>
                {summary.inProgress} milestone(s) currently in progress and {summary.planned} still planned.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-500" />
              <p>{summary.overdueOpen} overdue open milestone(s) requiring recovery action.</p>
            </div>
            <div className="flex items-start gap-2">
              <Flag className="mt-0.5 h-4 w-4 text-amber-500" />
              <p>{summary.dueSoon} milestone(s) due within the next 7 days.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
              <p>
                {summary.completed} completed, {summary.missed} missed, {summary.cancelled} cancelled.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
