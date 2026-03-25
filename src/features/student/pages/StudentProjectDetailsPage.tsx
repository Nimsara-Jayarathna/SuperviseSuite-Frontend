import { CalendarDays, Clock3, Users, ChevronDown, Check, Github, RefreshCw, ExternalLink } from 'lucide-react';
import { useCallback } from 'react';
import { CommitActivitySection } from '@/features/projects/components/CommitActivitySection';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StudentProjectDetailsSkeleton } from '../components/StudentProjectDetailsSkeleton';
import { useStudentProject } from '../hooks/useStudentProject';
import { studentApi } from '../api/studentApi';
import type {
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

function getLifecycleTone(status: string): any {
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

export function StudentProjectDetailsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project, isLoading, error, reload } = useStudentProject(projectId);
  const loadActivityPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return studentApi.getProjectGitHubActivityPage(projectId, page);
    },
    [projectId],
  );
  const loadContributorsPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return studentApi.getProjectGitHubContributorsPage(projectId, page);
    },
    [projectId],
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
  const tabs: StudentProjectDetailTab[] = [...BASE_TABS, 'github'];
  const activeTab = requestedTab && tabs.includes(requestedTab) ? requestedTab : 'overview';

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.title}
        subtitle={project.summary ?? 'No summary has been recorded for this project yet.'}
      />

      <section className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:shadow-md">
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

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Milestone</span>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Team</span>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</span>
              <span className="font-semibold text-slate-700">{project.progressPercent ?? 0}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Project details</h2>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Batch</p>
                  <p className="mt-1 font-semibold text-slate-700">{project.batch ?? 'Not set'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Semester</p>
                  <p className="mt-1 font-semibold text-slate-700">{project.semester ?? 'Not set'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Health note</p>
                  <div className="mt-2 rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50">
                    <p className="text-sm leading-relaxed text-slate-600">
                      {project.healthNote ?? 'No health note recorded yet.'}
                    </p>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Project leader</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {project.leader ? leaderDisplayName(project.leader).charAt(0).toUpperCase() : '?'}
                    </div>
                    <p className="font-semibold text-slate-700">
                      {project.leader ? leaderDisplayName(project.leader) : 'No leader assigned'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <h2 className="text-lg font-semibold text-foreground">Primary milestone</h2>
              {project.milestones.length > 0 ? (
                <div className="mt-5">
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-800">{project.milestones[0].title}</p>
                      <StatusBadge tone="student" className="text-[10px] font-black uppercase">
                        {project.milestones[0].status}
                      </StatusBadge>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 font-medium">
                      <CalendarDays className="h-4 w-4" />
                      <span>Due {dateFormatter.format(new Date(project.milestones[0].dueDate))}</span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-500 line-clamp-3">
                      {project.milestones[0].description ?? 'No description provided.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-muted-foreground">No milestones recorded yet.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {activeTab === 'team' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Team</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {project.members.map((member) => (
              <div
                key={member.id}
                className={`rounded-2xl border p-4 ${
                  member.memberRole === 'SUPERVISOR'
                    ? 'border-indigo-200 bg-indigo-50/40'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className="font-medium text-foreground">{memberDisplayName(member)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RoleBadge role={member.memberRole} />
                  {project.leader?.id === member.id ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                      Leader
                    </span>
                  ) : null}
                  {member.registrationNumber ? (
                    <span className="text-xs text-muted-foreground">
                      • {member.registrationNumber}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'milestones' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Milestones</h2>
          {project.milestones.length > 0 ? (
            <div className="mt-5 space-y-4">
              {project.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-foreground">
                      {milestone.sequenceNo}. {milestone.title}
                    </p>
                    <span className="text-sm text-muted-foreground">{milestone.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Due {dateFormatter.format(new Date(milestone.dueDate))}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {milestone.description ?? 'No description provided.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No milestones recorded yet.</p>
          )}
        </section>
      ) : null}

      {activeTab === 'github' ? (
        <div className="space-y-4">
          <section className="relative z-20">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Active Repository
                </span>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Github className="h-4 w-4" />
                  </div>
                  <span className="truncate font-bold text-slate-800">
                    {project.repositoryUrl ? project.repositoryUrl.split('/').pop() : 'No repository linked'}
                  </span>
                  {project.repositoryUrl && (
                    <a 
                      href={project.repositoryUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-3 sm:flex">
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sync Status</span>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-bold text-slate-600">Linked</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <CommitActivitySection
            isLoading={isLoading}
            error={null}
            data={project.github}
            onRetry={() => void reload()}
            loadActivityPage={loadActivityPage}
            loadContributorsPage={loadContributorsPage}
            canRefresh={false}
            isRefreshing={false}
            onNavigateToOverview={() => handleTabChange('overview')}
          />
        </div>
      ) : null}
    </div>
  );
}
