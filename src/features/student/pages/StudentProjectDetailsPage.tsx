import {
  AlertTriangle,
  CalendarDays,
  Target,
  Clock3,
  Users,
  ChevronDown,
  Check,
  Github,
  ExternalLink,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  Clock,
  Flag,
  ShieldCheck,
  Crown,
  GitBranch,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import { useBlockingError } from '@/app/layout/BlockingErrorContext';
import { CommitActivitySection } from '@/features/projects/components/CommitActivitySection';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { PageTabs } from '@/components/ui/PageTabs';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LastSyncedBadge } from '@/components/ui/LastSyncedBadge';
import { SyncStatusBadge } from '@/components/ui/SyncStatusBadge';
import { cn } from '@/lib/cn';
import { normalizeSyncStatus } from '@/lib/syncStatus';
import { StudentProjectDetailsSkeleton } from '../components/StudentProjectDetailsSkeleton';
import { useStudentProject } from '../hooks/useStudentProject';
import { studentApi } from '../api/studentApi';
// NOTE: intentional cross-feature import. JiraHealthOverview is a shared
// presentational component used by both supervisor and student roles.
// student/types and student/api already import from the supervisor feature,
// establishing this as an accepted pattern in this codebase.
// If a stricter module boundary is introduced, move the jira/ subfolder to
// src/components/jira/ and update all import paths.
import { JiraHealthOverview } from '@/features/supervisor/components/ProjectDetail/jira/JiraHealthOverview';
import { isBlockingError } from '@/utils/errorSeverity';
import { StudentFilesTabSection } from '../components/StudentFilesTabSection';
import { StudentMeetingsTabSection } from '../components/StudentMeetingsTabSection';
import type {
  ProjectGitHubActivity,
  StudentProjectDetail,
  StudentProjectDetailLeader,
  StudentProjectDetailMember,
  StudentProjectDetailTab,
} from '../types';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const BASE_TABS: StudentProjectDetailTab[] = ['overview', 'team', 'milestones'];

function memberDisplayName(member: StudentProjectDetailMember) {
  return `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.email;
}

function leaderDisplayName(leader: StudentProjectDetailLeader) {
  return `${leader.firstName ?? ''} ${leader.lastName ?? ''}`.trim() || leader.email;
}

function toTabLabel(tab: string) {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

type StatusBadgeTone = NonNullable<ComponentProps<typeof StatusBadge>['tone']>;

function getLifecycleTone(status: string): StatusBadgeTone {
  switch (status) {
    case 'PLANNING':
      return 'student';
    case 'ACTIVE':
      return 'success';
    case 'AT_RISK':
      return 'warning';
    case 'BEHIND':
      return 'danger';
    case 'COMPLETED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function getMilestoneTone(status: string): StatusBadgeTone {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'student'; // using student for sky/blue feel
    case 'PLANNED':
      return 'neutral';
    case 'MISSED':
      return 'danger';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function getStatusIcon(status: string, className?: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className={className} />;
    case 'IN_PROGRESS':
      return <Clock className={className} />;
    case 'PLANNED':
      return <Circle className={className} />;
    case 'MISSED':
      return <AlertCircle className={className} />;
    case 'CANCELLED':
      return <XCircle className={className} />;
    default:
      return <Circle className={className} />;
  }
}

type MilestoneDetail = StudentProjectDetail['milestones'][number];

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

function buildMilestoneSummary(project: StudentProjectDetail): MilestoneSummary {
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
  let dueSoon = 0;
  let chronologyViolations = 0;
  let highestRiskMilestone: MilestoneDetail | null = null;
  let previousDueDate: Date | null = null;

  for (const milestone of orderedMilestones) {
    statusCounts[milestone.status] += 1;

    const dueDate = parseLocalDate(milestone.dueDate);
    const isOpen = OPEN_STATUSES.has(milestone.status);
    const isOverdue = isOpen && dueDate.getTime() < now.getTime();
    const isDueSoon =
      isOpen && dueDate.getTime() >= now.getTime() && dueDate.getTime() <= dueSoonBoundary.getTime();

    if (isOverdue) {
      overdueOpen += 1;
      if (
        highestRiskMilestone === null ||
        parseLocalDate(highestRiskMilestone.dueDate).getTime() > dueDate.getTime()
      ) {
        highestRiskMilestone = milestone;
      }
    }

    if (isDueSoon) {
      dueSoon += 1;
    }

    if (previousDueDate && dueDate.getTime() < previousDueDate.getTime()) {
      chronologyViolations += 1;
    }
    previousDueDate = dueDate;
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

  let riskLevel = RISK_LOW;
  if (chronologyViolations > 0 || overdueOpen >= 2) {
    riskLevel = RISK_HIGH;
  } else if (overdueOpen === 1 || dueSoon >= 2) {
    riskLevel = RISK_MEDIUM;
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
    dueSoon,
    chronologyViolations,
    riskLevel,
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

function buildFocusItems(project: StudentProjectDetail, summary: MilestoneSummary): string[] {
  if (summary.total === 0) {
    return [
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
    items.push('Request a project leader assignment to centralize communication and milestone accountability.');
  }

  if (summary.active > 0 && summary.completed === summary.active) {
    items.push('All active milestones are done. Prepare closure notes and request lifecycle completion approval.');
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

export function StudentProjectDetailsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project, isLoading, error, reload } = useStudentProject(projectId);
  const jira = project?.jira ?? null;
  const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false);
  const [selectedGitHubRepositoryLinkId, setSelectedGitHubRepositoryLinkId] = useState<
    string | null
  >(null);
  const [githubView, setGithubView] = useState<ProjectGitHubActivity | null>(
    project?.github ?? null,
  );
  const [isGitHubViewLoading, setIsGitHubViewLoading] = useState(false);
  const { showBlockingError, clearBlockingError } = useBlockingError();
  const retryLoad = useCallback(() => {
    void reload();
  }, [reload]);

  const enabledRepositories = useMemo(
    () =>
      project?.githubRepositories?.repositories?.filter((repository) => repository.enabled) ?? [],
    [project?.githubRepositories?.repositories],
  );
  const activeRepository = useMemo(
    () =>
      enabledRepositories.find((repository) => repository.id === selectedGitHubRepositoryLinkId) ??
      null,
    [enabledRepositories, selectedGitHubRepositoryLinkId],
  );
  const activeRepositorySyncStatus = normalizeSyncStatus(activeRepository?.syncStatus);

  useEffect(() => {
    setGithubView(project?.github ?? null);
  }, [project?.github]);

  useEffect(() => {
    if (error && isBlockingError(error)) {
      showBlockingError(error, retryLoad);
      return;
    }
    clearBlockingError();
  }, [error, showBlockingError, clearBlockingError, retryLoad]);

  useEffect(() => {
    const primaryLink =
      enabledRepositories.find((repository) => repository.primary) ??
      enabledRepositories[0] ??
      null;
    setSelectedGitHubRepositoryLinkId(primaryLink?.id ?? null);
  }, [enabledRepositories]);

  async function handleSelectGitHubRepository(linkedRepositoryId: string) {
    if (!projectId) {
      setSelectedGitHubRepositoryLinkId(linkedRepositoryId);
      return;
    }
    setSelectedGitHubRepositoryLinkId(linkedRepositoryId);
    setIsGitHubViewLoading(true);
    try {
      const nextView = await studentApi.getProjectGitHubDashboard(
        projectId,
        false,
        linkedRepositoryId,
      );
      setGithubView(nextView);
    } finally {
      setIsGitHubViewLoading(false);
    }
  }

  const loadActivityPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return studentApi.getProjectGitHubActivityPage(
        projectId,
        page,
        selectedGitHubRepositoryLinkId,
      );
    },
    [projectId, selectedGitHubRepositoryLinkId],
  );
  const loadContributorsPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return studentApi.getProjectGitHubContributorsPage(
        projectId,
        page,
        selectedGitHubRepositoryLinkId,
      );
    },
    [projectId, selectedGitHubRepositoryLinkId],
  );

  function handleTabChange(tab: StudentProjectDetailTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }
    setSearchParams(nextParams, { replace: true });
  }

  if (isLoading) {
    return <StudentProjectDetailsSkeleton />;
  }

  if (error) {
    if (isBlockingError(error)) {
      return null;
    }

    if (error.code === 'NOT_FOUND') {
      return (
        <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Project not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested student project could not be found or is not assigned to your account.
          </p>
          <Link
            to="/student/projects"
            className={buttonStyles({ variant: 'primary', size: 'md', className: 'mt-6' })}
          >
            Back to projects
          </Link>
        </div>
      );
    }

    return <ErrorState error={error} onRetry={() => void reload()} />;
  }

  if (!project) {
    return null;
  }

  const requestedTab = searchParams.get('tab') as StudentProjectDetailTab | null;
  const tabs: StudentProjectDetailTab[] = [...BASE_TABS, 'files', 'github', 'jira', 'meetings'];
  const activeTab = requestedTab && tabs.includes(requestedTab) ? requestedTab : 'overview';
  const summary = buildMilestoneSummary(project);
  const healthBrief = buildHealthBrief(project.healthNote, summary);
  const focusItems = buildFocusItems(project, summary);
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

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {project.title}
          </h1>
          <p
            className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.summary ?? 'No summary has been recorded for this project yet.'}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Lifecycle
            </span>
            <div className="mt-0.5">
              <StatusBadge
                tone={getLifecycleTone(project.status)}
                className="border-none bg-transparent p-0 text-[13px] font-black uppercase tracking-tight"
              >
                {project.status.replace('_', ' ')}
              </StatusBadge>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Milestone
              </span>
              <span className="font-semibold text-slate-700">
                {project.milestoneDate
                  ? dateFormatter.format(new Date(project.milestoneDate))
                  : 'Not set'}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Team
              </span>
              <span className="font-semibold text-slate-700">
                {project.members.length} member{project.members.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock3 className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Progress
              </span>
              <span className="font-semibold text-slate-700">{project.progressPercent ?? 0}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Batch', value: project.batch ?? 'Not set' },
          { label: 'Semester', value: project.semester ?? 'Not set' },
          { label: 'Milestones', value: String(project.milestones.length) },
          {
            label: 'Last Activity',
            value: project.lastActivityAt
              ? dateTimeFormatter.format(new Date(project.lastActivityAt))
              : 'Not recorded',
            small: true,
          },
        ].map(({ label, value, small }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <p className={`mt-2 font-semibold text-foreground ${small ? 'text-sm' : 'text-2xl'}`}>
              {value}
            </p>
          </div>
        ))}
      </section>

      <PageTabs
        items={tabs.map((tab) => ({
          value: tab,
          label: toTabLabel(tab),
        }))}
        value={activeTab}
        onChange={(value) => handleTabChange(value as StudentProjectDetailTab)}
        tone="neutral"
      />

      {activeTab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">Project details</h2>
              </div>
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
                  <p className="mt-1 font-semibold text-slate-700">
                    {project.semester ?? 'Not set'}
                  </p>
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
                    <p className="text-sm leading-relaxed text-slate-600">
                      {healthBrief.text}
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Project leader
                  </p>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {project.leader
                        ? leaderDisplayName(project.leader).charAt(0).toUpperCase()
                        : '?'}
                    </div>
                    <p className="min-w-0 truncate font-semibold text-slate-700">
                      {project.leader ? leaderDisplayName(project.leader) : 'No leader assigned'}
                    </p>
                  </div>
                </div>
              </div>
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
                      <p className="mt-2 font-bold text-slate-800">{primaryMilestone.milestone.title}</p>
                      <StatusBadge
                        tone={getMilestoneTone(primaryMilestone.milestone.status)}
                        className="text-[10px] font-black uppercase"
                      >
                        {primaryMilestone.milestone.status}
                      </StatusBadge>
                    </div>
                    <div
                      className={cn('mt-3 flex items-center gap-2 text-sm font-medium', spotlightToneClasses.label)}
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span>Due {dateFormatter.format(parseLocalDate(primaryMilestone.milestone.dueDate))}</span>
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
                    {summary.inProgress} milestone(s) currently in progress and {summary.planned} still planned.
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
                    {summary.completed} completed, {summary.missed} missed, {summary.cancelled} cancelled.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {activeTab === 'team' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Team</h2>
            <p className="text-xs font-medium text-slate-400">
              Total {project.members.length} members assigned
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.members.map((member) => (
              <div
                key={member.id}
                className={`group relative overflow-hidden rounded-3xl border p-5 transition-all hover:shadow-lg ${
                  member.memberRole === 'SUPERVISOR'
                    ? 'border-indigo-100 bg-indigo-50/20'
                    : 'border-slate-100 bg-white'
                }`}
              >
                {/* Background pattern */}
                <div
                  className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 transition-transform group-hover:scale-150 ${
                    member.memberRole === 'SUPERVISOR' ? 'bg-indigo-600' : 'bg-slate-400'
                  }`}
                />

                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-black shadow-inner ${
                        member.memberRole === 'SUPERVISOR'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {memberDisplayName(member).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black tracking-tight text-slate-800">
                        {memberDisplayName(member)}
                      </p>
                      <p className="truncate text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <RoleBadge role={member.memberRole} />

                    {project.leader?.id === member.id && (
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                        <StatusBadge
                          tone="warning"
                          className="border-none bg-amber-100 text-[10px] font-black uppercase tracking-wider text-amber-700"
                        >
                          Leader
                        </StatusBadge>
                      </div>
                    )}

                    {member.registrationNumber && (
                      <div className="flex items-center gap-1.5 rounded-xl border border-dotted border-slate-200 bg-slate-50/50 px-2.5 py-1 text-[10px] font-black tracking-tight text-slate-500">
                        <ShieldCheck className="h-3 w-3" />
                        {member.registrationNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'milestones' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Milestones</h2>
            <p className="text-xs font-medium text-slate-400">
              Total {project.milestones.length} milestones defined
            </p>
          </div>

          {project.milestones.length > 0 ? (
            <div className="mt-6 space-y-4">
              {project.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:shadow-lg group"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex shrink-0 items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-base font-black text-slate-400 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        {String(milestone.sequenceNo).padStart(2, '0')}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <h4 className="text-lg font-black tracking-tight text-slate-800 transition-colors group-hover:text-indigo-900">
                            {milestone.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>Due {dateFormatter.format(new Date(milestone.dueDate))}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusIcon(milestone.status, 'h-4 w-4 text-slate-300')}
                          <StatusBadge tone={getMilestoneTone(milestone.status)}>
                            {milestone.status.replace('_', ' ')}
                          </StatusBadge>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-slate-500 line-clamp-2">
                        {milestone.description ?? 'No description provided for this milestone.'}
                      </p>
                    </div>
                  </div>

                  {index < project.milestones.length - 1 && (
                    <div className="absolute left-[3.5rem] bottom-0 top-[4.5rem] w-0.5 bg-slate-50 -z-10 group-hover:bg-indigo-50/50" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 shadow-inner">
                <Flag className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-bold">No milestones recorded yet.</p>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'files' ? (
        <StudentFilesTabSection projectId={project.id} initialFiles={project.files} />
      ) : null}

      {activeTab === 'github' ? (
        <div className="space-y-4">
          {activeRepository && (
            <section className="relative z-20">
              <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:flex-row">
                {/* Left: icon + full repo identity */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Github className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Active repository
                    </span>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0">
                      <span className="text-[15px] font-bold leading-tight text-slate-900">
                        {activeRepository.customName?.trim() ||
                          activeRepository.name ||
                          'Unnamed repository'}
                      </span>
                      {activeRepository.url && (
                        <a
                          href={activeRepository.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-indigo-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Visit
                        </a>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {activeRepository.fullName && (
                        <span className="text-[11px] text-slate-400">
                          {activeRepository.fullName}
                        </span>
                      )}
                      {activeRepository.defaultBranch && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <GitBranch className="h-3 w-3 text-indigo-400" />
                          {activeRepository.defaultBranch}
                        </span>
                      )}
                      {activeRepository.lastSyncedAt &&
                        activeRepositorySyncStatus === 'SUCCESS' && (
                          <LastSyncedBadge
                            lastSyncedAt={activeRepository.lastSyncedAt}
                            className="bg-transparent p-0 text-[11px] text-slate-400"
                            iconClassName="h-3 w-3 text-emerald-400"
                          />
                        )}
                      <SyncStatusBadge syncStatus={activeRepositorySyncStatus} mode="health" />
                    </div>
                  </div>
                </div>

                {/* Right: Switch only — students cannot refresh */}
                {enabledRepositories.length > 1 && (
                  <div className="relative pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsRepoSelectorOpen(!isRepoSelectorOpen)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                    >
                      Switch
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isRepoSelectorOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isRepoSelectorOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsRepoSelectorOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 sm:left-auto sm:right-0 sm:min-w-[280px]">
                          {enabledRepositories.map((repo) => {
                            const isSelected = repo.id === selectedGitHubRepositoryLinkId;
                            return (
                              <button
                                key={repo.id}
                                type="button"
                                onClick={() => {
                                  void handleSelectGitHubRepository(repo.id);
                                  setIsRepoSelectorOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-all hover:bg-indigo-50 ${
                                  isSelected ? 'bg-indigo-50/60' : 'bg-white'
                                }`}
                              >
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                    isSelected
                                      ? 'bg-indigo-100 text-indigo-600'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  <Github className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span
                                    className={`block truncate text-[13px] font-bold ${
                                      isSelected ? 'text-indigo-800' : 'text-slate-800'
                                    }`}
                                  >
                                    {repo.customName?.trim() || repo.name || 'Unnamed repository'}
                                  </span>
                                  <span className="block truncate text-[11px] text-slate-400">
                                    {repo.fullName}
                                  </span>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 shrink-0 text-indigo-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <CommitActivitySection
            isLoading={isLoading || isGitHubViewLoading}
            error={null}
            data={githubView}
            onRetry={() => void reload()}
            loadActivityPage={loadActivityPage}
            loadContributorsPage={loadContributorsPage}
            emptyStateDescription="Please wait for your supervisor to link a GitHub repository to this project. Repository management is restricted to supervisors."
          />
        </div>
      ) : null}

      {activeTab === 'jira' ? (
        <section className="space-y-4">
          {jira?.connected && projectId ? (
            <>
              <JiraHealthOverview
                fetcher={studentApi.getJiraHealth}
                sprintFetcher={studentApi.getJiraSprintProgress}
                workloadFetcher={studentApi.getJiraWorkload}
                hierarchyFetcher={studentApi.getProjectJiraHierarchy}
                projectId={projectId}
                workspaceName={jira.workspaceName}
                workspaceUrl={jira.workspaceUrl}
              />
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
              Jira workspace is not connected for this project. Ask your supervisor to connect it
              from the Integrations tab.
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'meetings' && projectId ? (
        <StudentMeetingsTabSection projectId={projectId} />
      ) : null}
    </div>
  );
}
