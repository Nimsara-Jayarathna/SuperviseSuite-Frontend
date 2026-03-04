import { CalendarDays, Clock3, Users } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StudentProjectDetailsSkeleton } from '../components/StudentProjectDetailsSkeleton';
import { useStudentProject } from '../hooks/useStudentProject';
import type { StudentProjectDetailMember, StudentProjectDetailTab } from '../types';

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

const TABS: StudentProjectDetailTab[] = ['overview', 'team', 'milestones'];

function memberDisplayName(member: StudentProjectDetailMember) {
  return `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.email;
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'AT_RISK') return 'warning';
  if (status === 'BEHIND') return 'danger';
  if (status === 'COMPLETED') return 'neutral';
  return 'student';
}

function toTabLabel(tab: string) {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

export function StudentProjectDetailsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project, isLoading, error, reload } = useStudentProject(projectId);

  const requestedTab = searchParams.get('tab') as StudentProjectDetailTab | null;
  const activeTab = requestedTab && TABS.includes(requestedTab) ? requestedTab : 'overview';

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.title}
        subtitle={project.summary ?? 'No summary has been recorded for this project yet.'}
      />

      <section className="flex flex-wrap gap-3">
        <StatusBadge tone={statusTone(project.status)}>
          {project.status.replace('_', ' ')}
        </StatusBadge>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <CalendarDays className="h-4 w-4" />
          {project.milestoneDate
            ? `Milestone ${dateFormatter.format(new Date(project.milestoneDate))}`
            : 'Milestone not set'}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <Users className="h-4 w-4" />
          {project.members.length} team member{project.members.length === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <Clock3 className="h-4 w-4" />
          Progress {project.progressPercent ?? 0}%
        </span>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Batch
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {project.batch ?? 'Not set'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Semester
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {project.semester ?? 'Not set'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Milestones
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{project.milestones.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Last Activity
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {project.lastActivityAt
              ? dateTimeFormatter.format(new Date(project.lastActivityAt))
              : 'Not recorded'}
          </p>
        </div>
      </section>

      <PageTabs
        items={TABS.map((tab) => ({
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
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Project summary</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Batch</p>
                  <p className="mt-1 font-medium text-foreground">{project.batch ?? 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Semester
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {project.semester ?? 'Not set'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Health note
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">
                    {project.healthNote ?? 'No health note recorded yet.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Primary milestone</h2>
            {project.milestones.length > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-foreground">{project.milestones[0].title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Due {dateFormatter.format(new Date(project.milestones[0].dueDate))}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {project.milestones[0].description ?? 'No description provided.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No milestones recorded yet.</p>
            )}
          </aside>
        </div>
      ) : null}

      {activeTab === 'team' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Team</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {project.members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-foreground">{memberDisplayName(member)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {member.memberRole}
                  {member.registrationNumber ? ` • ${member.registrationNumber}` : ''}
                </p>
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
    </div>
  );
}
