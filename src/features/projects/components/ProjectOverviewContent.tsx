import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileStack,
  Flag,
  Github,
  MessagesSquare,
  PlugZap,
  Target,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { buttonStyles } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { parseLocalDateOnly } from '@/lib/dateOnly';
import type { MeetingAnalyticsState } from '@/features/projects/hooks/useMeetingAnalytics';

type StatusBadgeTone = 'student' | 'supervisor' | 'success' | 'warning' | 'danger' | 'neutral';

type MilestoneStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

type OverviewMilestone = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: MilestoneStatus;
  sequenceNo: number;
  isOverdue?: boolean;
  isChronologyViolation?: boolean;
};

type OverviewLeader = {
  firstName: string | null;
  lastName: string | null;
  email: string;
} | null;

type MilestoneInsights = {
  dueSoonCount: number;
  timelineRiskLevel: string;
} | null;

export type ProjectOverviewProject = {
  id: string;
  batch: string | null;
  semester: string | null;
  progressPercent: number | null;
  leader: OverviewLeader;
  milestones: OverviewMilestone[];
  milestoneInsights?: MilestoneInsights;
  files: {
    items: unknown[];
    config: {
      allowedTypes: string[];
    };
  } | null;
  githubRepositories?: {
    repositories: Array<{ enabled: boolean }>;
    accessSources: unknown[];
  } | null;
  jira?: {
    connected: boolean;
    syncStatus?: string | null;
  } | null;
};

type OverviewRole = 'supervisor' | 'student';

type ProjectOverviewEditForm = {
  title: string;
  summary: string;
  batch: string;
  semester: string;
  lifecycleStatus: string;
};

export type ProjectOverviewTextField = 'title' | 'summary' | 'batch' | 'semester';

type ProjectOverviewFieldLimits = {
  title: number;
  summary: number;
  batch: number;
  semester: number;
};

const DEFAULT_FIELD_LIMITS: ProjectOverviewFieldLimits = {
  title: 40,
  summary: 250,
  batch: 32,
  semester: 32,
};

type ProjectOverviewEditState = {
  isEditing: boolean;
  isSaving: boolean;
  isDirty: boolean;
  form: ProjectOverviewEditForm | null;
  lifecycleOptions: string[];
  fieldLimits?: ProjectOverviewFieldLimits;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onChangeField: (field: ProjectOverviewTextField, value: string) => void;
  onLifecycleChange: (value: string) => void;
};

type ProjectOverviewContentProps = {
  project: ProjectOverviewProject;
  role: OverviewRole;
  meetingAnalytics: MeetingAnalyticsState;
  edit?: ProjectOverviewEditState;
};

type MilestoneSummary = {
  orderedMilestones: OverviewMilestone[];
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
  nextUpcoming: OverviewMilestone | null;
  latestCompleted: OverviewMilestone | null;
  highestRiskMilestone: OverviewMilestone | null;
};

const OPEN_STATUSES = new Set<MilestoneStatus>(['PLANNED', 'IN_PROGRESS']);
const RISK_LOW = 'LOW';
const RISK_MEDIUM = 'MEDIUM';
const RISK_HIGH = 'HIGH';

function dueDateTime(value: string): number {
  const parsed = parseLocalDateOnly(value);
  return parsed ? parsed.getTime() : Number.POSITIVE_INFINITY;
}

function leaderDisplayName(leader: OverviewLeader) {
  if (!leader) {
    return 'No leader assigned';
  }
  const fullName = `${leader.firstName ?? ''} ${leader.lastName ?? ''}`.trim();
  return fullName || leader.email;
}

function getMilestoneTone(status: MilestoneStatus): StatusBadgeTone {
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

function overdueTone(count: number): StatusBadgeTone {
  if (count >= 2) {
    return 'danger';
  }
  if (count === 1) {
    return 'warning';
  }
  return 'success';
}

function dueSoonTone(count: number): StatusBadgeTone {
  if (count >= 3) {
    return 'danger';
  }
  if (count >= 1) {
    return 'warning';
  }
  return 'success';
}

function getToneClasses(tone: StatusBadgeTone): {
  card: string;
  label: string;
  value: string;
  panel: string;
} {
  switch (tone) {
    case 'danger':
      return {
        card: 'border-rose-200 bg-rose-50/70',
        label: 'text-rose-700',
        value: 'text-rose-800',
        panel: 'border-rose-200 bg-rose-50/40',
      };
    case 'warning':
      return {
        card: 'border-amber-200 bg-amber-50/70',
        label: 'text-amber-700',
        value: 'text-amber-800',
        panel: 'border-amber-200 bg-amber-50/35',
      };
    case 'success':
      return {
        card: 'border-emerald-200 bg-emerald-50/70',
        label: 'text-emerald-700',
        value: 'text-emerald-800',
        panel: 'border-emerald-200 bg-emerald-50/35',
      };
    case 'student':
      return {
        card: 'border-sky-200 bg-sky-50/70',
        label: 'text-sky-700',
        value: 'text-sky-800',
        panel: 'border-sky-200 bg-sky-50/35',
      };
    case 'supervisor':
      return {
        card: 'border-indigo-200 bg-indigo-50/70',
        label: 'text-indigo-700',
        value: 'text-indigo-800',
        panel: 'border-indigo-200 bg-indigo-50/35',
      };
    case 'neutral':
    default:
      return {
        card: 'border-slate-200 bg-slate-50/70',
        label: 'text-slate-500',
        value: 'text-slate-800',
        panel: 'border-slate-200 bg-slate-50/30',
      };
  }
}

function buildMilestoneSummary(project: ProjectOverviewProject): MilestoneSummary {
  const orderedMilestones = [...project.milestones].sort((left, right) => {
    if (left.sequenceNo !== right.sequenceNo) {
      return left.sequenceNo - right.sequenceNo;
    }
    return dueDateTime(left.dueDate) - dueDateTime(right.dueDate);
  });

  const statusCounts: Record<MilestoneStatus, number> = {
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
  let highestRiskMilestone: OverviewMilestone | null = null;
  let previousDueDate: Date | null = null;

  for (const milestone of orderedMilestones) {
    statusCounts[milestone.status] += 1;

    if (milestone.isChronologyViolation) {
      chronologyViolations += 1;
    }

    const dueDate = parseLocalDateOnly(milestone.dueDate);
    const isOpen = OPEN_STATUSES.has(milestone.status);
    const isOverdue =
      isOpen &&
      (milestone.isOverdue === true || (dueDate ? dueDate.getTime() < now.getTime() : false));

    if (isOverdue) {
      overdueOpen += 1;
      if (
        highestRiskMilestone === null ||
        dueDateTime(highestRiskMilestone.dueDate) > dueDateTime(milestone.dueDate)
      ) {
        highestRiskMilestone = milestone;
      }
    }

    if (
      isOpen &&
      dueDate !== null &&
      dueDate.getTime() >= now.getTime() &&
      dueDate.getTime() <= dueSoonBoundary.getTime()
    ) {
      dueSoonComputed += 1;
    }

    if (previousDueDate && dueDate && dueDate.getTime() < previousDueDate.getTime()) {
      chronologyViolations += 1;
    }
    previousDueDate = dueDate ?? previousDueDate;
  }

  const nextUpcoming =
    orderedMilestones.find((milestone) => {
      if (!OPEN_STATUSES.has(milestone.status)) {
        return false;
      }
      const dueDate = parseLocalDateOnly(milestone.dueDate);
      return dueDate ? dueDate.getTime() >= now.getTime() : false;
    }) ?? null;

  const latestCompleted =
    [...orderedMilestones].reverse().find((milestone) => milestone.status === 'COMPLETED') ?? null;

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

function buildHealthBrief(summary: MilestoneSummary) {
  if (summary.total === 0) {
    return {
      text: 'No milestones recorded yet. Add dated milestones to start measuring delivery confidence and risk.',
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

function buildFocusItems(
  role: OverviewRole,
  project: ProjectOverviewProject,
  summary: MilestoneSummary,
): string[] {
  if (summary.total === 0) {
    return role === 'supervisor'
      ? [
          'Define at least 3 milestones with due dates so delivery health can be tracked week by week.',
          'Assign a project leader to own delivery follow-ups and unblock milestone owners quickly.',
        ]
      : [
          'Define at least 3 milestones with due dates so delivery health can be tracked week by week.',
          'Ask the team lead to run a weekly milestone checkpoint to avoid late surprises.',
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
    items.push(
      role === 'supervisor'
        ? 'Assign a project leader to centralize communication and milestone accountability.'
        : 'Request a project leader assignment to centralize communication and milestone accountability.',
    );
  }

  if (summary.active > 0 && summary.completed === summary.active) {
    items.push(
      role === 'supervisor'
        ? 'All active milestones are done. Prepare closure evidence and transition lifecycle to COMPLETED.'
        : 'All active milestones are done. Prepare closure notes and request lifecycle completion approval.',
    );
  }

  if (items.length === 0) {
    items.push(
      'No urgent blockers detected. Keep milestone updates weekly to preserve this risk level.',
    );
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

const DATE_FORMATTER = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function ProjectOverviewContent({
  project,
  role,
  meetingAnalytics,
  edit,
}: ProjectOverviewContentProps) {
  const summary = buildMilestoneSummary(project);
  const healthBrief = buildHealthBrief(summary);
  const focusItems = buildFocusItems(role, project, summary);
  const primaryMilestone = pickPrimaryMilestone(summary);
  const riskTone = getRiskTone(summary.riskLevel);
  const riskToneClasses = getToneClasses(riskTone);
  const overdueToneClasses = getToneClasses(overdueTone(summary.overdueOpen));
  const dueSoonToneClasses = getToneClasses(dueSoonTone(summary.dueSoon));
  const completedToneClasses = getToneClasses(
    summary.active > 0 && summary.completed === summary.active ? 'success' : 'student',
  );
  const spotlightToneClasses = getToneClasses(
    primaryMilestone ? getMilestoneTone(primaryMilestone.milestone.status) : 'neutral',
  );
  const filesUploadedCount = project.files?.items.length ?? 0;
  const allowedFileTypesCount = project.files?.config.allowedTypes.length ?? 0;
  const linkedRepositoriesCount = project.githubRepositories?.repositories.length ?? 0;
  const enabledRepositoriesCount =
    project.githubRepositories?.repositories.filter((repository) => repository.enabled).length ?? 0;
  const githubSourceCount = project.githubRepositories?.accessSources.length ?? 0;
  const jiraConnected = Boolean(project.jira?.connected);
  const jiraSyncStatusLabel = jiraConnected
    ? (project.jira?.syncStatus ?? 'CONNECTED').replace(/_/g, ' ')
    : 'NOT CONNECTED';
  const fieldLimits = edit?.fieldLimits ?? DEFAULT_FIELD_LIMITS;
  const leaderName = leaderDisplayName(project.leader);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <section className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Project details</h2>
            {edit && !edit.isEditing ? (
              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                onClick={edit.onStartEdit}
              >
                Edit details
              </button>
            ) : null}
          </div>

          {edit?.isEditing && edit.form ? (
            <form className="mt-5 space-y-4" onSubmit={edit.onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Title
                  </span>
                  <input
                    required
                    maxLength={fieldLimits.title}
                    value={edit.form.title}
                    onChange={(event) => edit.onChangeField('title', event.target.value)}
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Lifecycle
                  </span>
                  <Select
                    value={edit.form.lifecycleStatus}
                    onChange={(event) => edit.onLifecycleChange(event.target.value)}
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                  >
                    {edit.lifecycleOptions.map((status) => (
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
                    maxLength={fieldLimits.batch}
                    value={edit.form.batch}
                    onChange={(event) => edit.onChangeField('batch', event.target.value)}
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Semester
                  </span>
                  <input
                    required
                    maxLength={fieldLimits.semester}
                    value={edit.form.semester}
                    onChange={(event) => edit.onChangeField('semester', event.target.value)}
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Summary
                  </span>
                  <textarea
                    required
                    maxLength={fieldLimits.summary}
                    rows={4}
                    value={edit.form.summary}
                    onChange={(event) => edit.onChangeField('summary', event.target.value)}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={edit.isSaving}
                  className={buttonStyles({ variant: 'secondary', size: 'md' })}
                  onClick={edit.onCancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={edit.isSaving || !edit.isDirty}
                  className={buttonStyles({ variant: 'primary', size: 'md' })}
                >
                  {edit.isSaving ? 'Saving...' : 'Save changes'}
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
                  <StatusBadge tone={riskTone} className="text-[10px] font-black">
                    {summary.riskLevel}
                  </StatusBadge>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Health brief
                </p>
                <div
                  className={cn(
                    'mt-2 rounded-2xl border p-4',
                    healthBrief.autoGenerated
                      ? riskToneClasses.panel
                      : 'border-slate-200 bg-slate-50/35',
                  )}
                >
                  {healthBrief.autoGenerated ? (
                    <p
                      className={cn(
                        'mb-2 text-[10px] font-bold uppercase tracking-[0.2em]',
                        riskToneClasses.label,
                      )}
                    >
                      Auto-generated from milestones
                    </p>
                  ) : null}
                  <p className="text-sm leading-relaxed text-slate-600">{healthBrief.text}</p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Project leader
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {leaderName.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-semibold text-slate-700">{leaderName}</p>
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
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Total milestones
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-800">{summary.total}</p>
            </div>
            <div className={cn('rounded-2xl border p-4', completedToneClasses.card)}>
              <p
                className={cn(
                  'text-[10px] font-bold uppercase tracking-[0.2em]',
                  completedToneClasses.label,
                )}
              >
                Completed
              </p>
              <p className={cn('mt-2 text-2xl font-semibold', completedToneClasses.value)}>
                {summary.completed}
              </p>
            </div>
            <div className={cn('rounded-2xl border p-4', overdueToneClasses.card)}>
              <p
                className={cn(
                  'text-[10px] font-bold uppercase tracking-[0.2em]',
                  overdueToneClasses.label,
                )}
              >
                Overdue open
              </p>
              <p className={cn('mt-2 text-2xl font-semibold', overdueToneClasses.value)}>
                {summary.overdueOpen}
              </p>
            </div>
            <div className={cn('rounded-2xl border p-4', dueSoonToneClasses.card)}>
              <p
                className={cn(
                  'text-[10px] font-bold uppercase tracking-[0.2em]',
                  dueSoonToneClasses.label,
                )}
              >
                Due in 7 days
              </p>
              <p className={cn('mt-2 text-2xl font-semibold', dueSoonToneClasses.value)}>
                {summary.dueSoon}
              </p>
            </div>
          </div>

          <div className={cn('mt-5 rounded-2xl border p-4', riskToneClasses.panel)}>
            <div className="flex items-center gap-2">
              <Target className={cn('h-4 w-4', riskToneClasses.label)} />
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
              <div className={cn('rounded-2xl border p-5', spotlightToneClasses.panel)}>
                <p
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-[0.2em]',
                    spotlightToneClasses.label,
                  )}
                >
                  {primaryMilestone.label}
                </p>
                <div className="flex items-center justify-between">
                  <p className="mt-2 font-bold text-slate-800">
                    {primaryMilestone.milestone.title}
                  </p>
                  <StatusBadge
                    tone={getMilestoneTone(primaryMilestone.milestone.status)}
                    className="text-[10px] font-black uppercase"
                  >
                    {primaryMilestone.milestone.status}
                  </StatusBadge>
                </div>
                <div
                  className={cn(
                    'mt-3 flex items-center gap-2 text-sm font-medium',
                    spotlightToneClasses.label,
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {(() => {
                      const dueDate = parseLocalDateOnly(primaryMilestone.milestone.dueDate);
                      return (
                        <>
                          Due{' '}
                          {dueDate
                            ? DATE_FORMATTER.format(dueDate)
                            : primaryMilestone.milestone.dueDate}
                        </>
                      );
                    })()}
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
              <Clock3
                className={cn(
                  'mt-0.5 h-4 w-4',
                  summary.inProgress > 0 ? 'text-sky-600' : 'text-slate-400',
                )}
              />
              <p>
                {summary.inProgress} milestone(s) currently in progress and {summary.planned} still
                planned.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle
                className={cn(
                  'mt-0.5 h-4 w-4',
                  summary.overdueOpen > 0 ? 'text-rose-600' : 'text-emerald-600',
                )}
              />
              <p>{summary.overdueOpen} overdue open milestone(s) requiring recovery action.</p>
            </div>
            <div className="flex items-start gap-2">
              <Flag
                className={cn(
                  'mt-0.5 h-4 w-4',
                  summary.dueSoon >= 3
                    ? 'text-rose-600'
                    : summary.dueSoon > 0
                      ? 'text-amber-600'
                      : 'text-emerald-600',
                )}
              />
              <p>{summary.dueSoon} milestone(s) due within the next 7 days.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
              <p>
                {summary.completed} completed, {summary.missed} missed, {summary.cancelled}{' '}
                cancelled.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <h2 className="text-lg font-semibold text-foreground">Workspace analytics</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Files uploaded
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-800">
                    {filesUploadedCount}
                  </p>
                  <p className="text-xs text-slate-500">
                    {allowedFileTypesCount} allowed file types
                  </p>
                </div>
                <FileStack className="h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    GitHub integration
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-800">
                    {enabledRepositoriesCount}/{linkedRepositoriesCount}
                  </p>
                  <p className="text-xs text-slate-500">{githubSourceCount} access source(s)</p>
                </div>
                <Github className="h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Jira workspace
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-800">
                    {jiraConnected ? 'Connected' : 'Not connected'}
                  </p>
                  <p className="text-xs text-slate-500">{jiraSyncStatusLabel}</p>
                </div>
                <PlugZap
                  className={cn('h-4 w-4', jiraConnected ? 'text-emerald-600' : 'text-amber-600')}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Meetings
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-800">
                    {meetingAnalytics.loading ? 'Loading...' : (meetingAnalytics.records ?? 0)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {meetingAnalytics.loading
                      ? 'Reading channels and records'
                      : `${meetingAnalytics.channels ?? 0} channels - ${meetingAnalytics.platformTypes ?? 0} platforms`}
                  </p>
                </div>
                <MessagesSquare className="h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 sm:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Meeting workflow
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-800">
                    {meetingAnalytics.loading
                      ? 'Loading...'
                      : `${meetingAnalytics.approvedChannels ?? 0} approved channels`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {meetingAnalytics.loading
                      ? 'Checking meeting approvals'
                      : `${meetingAnalytics.pendingRecords ?? 0} pending records`}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
