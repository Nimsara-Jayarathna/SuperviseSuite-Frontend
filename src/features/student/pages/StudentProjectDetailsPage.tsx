import { startTransition } from 'react';
import {
  CalendarDays,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileText,
  FolderGit2,
  Link as LinkIcon,
  MessageSquareMore,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { buttonStyles } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useStudentProjects } from '../hooks/useStudentProjects';
import type { StudentProjectActionItem, StudentProjectMeeting, StudentProjectTab } from '../types';

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

const AVAILABLE_TABS: StudentProjectTab[] = [
  'overview',
  'team',
  'activity',
  'meetings',
  'action-items',
  'files',
];

const ACTION_STYLES: Record<StudentProjectActionItem['status'], string> = {
  Done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'In progress': 'border-sky-200 bg-sky-50 text-sky-700',
  Blocked: 'border-rose-200 bg-rose-50 text-rose-700',
};

const MEETING_STYLES: Record<StudentProjectMeeting['status'], string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Draft: 'border-slate-200 bg-slate-100 text-slate-700',
};

export function StudentProjectDetailsPage() {
  const { projectId } = useParams();
  const { getProjectById } = useStudentProjects();
  const [searchParams, setSearchParams] = useSearchParams();

  const project = projectId ? getProjectById(projectId) : null;
  const requestedTab = searchParams.get('tab') as StudentProjectTab | null;
  const activeTab =
    requestedTab && AVAILABLE_TABS.includes(requestedTab) ? requestedTab : 'overview';

  if (!project) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Project not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The requested student project could not be resolved from the current workspace.
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

  function setActiveTab(nextTab: StudentProjectTab) {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams);

      if (nextTab === 'overview') {
        nextParams.delete('tab');
      } else {
        nextParams.set('tab', nextTab);
      }

      setSearchParams(nextParams, { replace: true });
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title={project.title} subtitle={project.summary} />

      <section className="flex flex-wrap gap-3">
        <StatusBadge
          tone={
            project.status === 'ACTIVE'
              ? 'success'
              : project.status === 'AT_RISK'
                ? 'warning'
                : 'student'
          }
        >
          {project.status.replace('_', ' ')}
        </StatusBadge>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <CalendarDays className="h-4 w-4" />
          Milestone {dateFormatter.format(new Date(project.milestoneDate))}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <Clock3 className="h-4 w-4" />
          Updated {dateTimeFormatter.format(new Date(project.lastUpdatedAt))}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <CircleAlert className="h-4 w-4" />
          {project.batch} • {project.semester}
        </span>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {project.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</p>
          </div>
        ))}
      </section>

      <PageTabs
        items={AVAILABLE_TABS.map((tab) => ({
          value: tab,
          label: tab.replace('-', ' '),
        }))}
        value={activeTab}
        onChange={(value) => setActiveTab(value as StudentProjectTab)}
        tone="neutral"
      />

      {activeTab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Key highlights</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                {project.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
              <div className="mt-4 space-y-3">
                {project.integrations.map((integration) => (
                  <div
                    key={integration.label}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">{integration.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{integration.status}</p>
                    </div>
                    {integration.href ? (
                      <a
                        href={integration.href}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonStyles({ variant: 'link', size: 'sm' })}
                      >
                        Open
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-slate-900 p-6 text-slate-100 shadow-sm">
              <h2 className="text-lg font-semibold">Quick links</h2>
              <div className="mt-4 space-y-3">
                {project.communicationUrl ? (
                  <a
                    href={project.communicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm transition-colors hover:bg-white/15"
                  >
                    <span className="inline-flex items-center gap-2">
                      <MessageSquareMore className="h-4 w-4" />
                      Communication channel
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
                {project.repositoryUrl ? (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm transition-colors hover:bg-white/15"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FolderGit2 className="h-4 w-4" />
                      Repository
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
                {project.jiraBoardUrl ? (
                  <a
                    href={project.jiraBoardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm transition-colors hover:bg-white/15"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Jira board
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'team' && (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Team</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {project.teamMembers.map((member) => (
              <div
                key={member}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-foreground"
              >
                {member}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'activity' && (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
          <div className="mt-5 space-y-4">
            {project.activity.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-foreground">{entry.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {dateTimeFormatter.format(new Date(entry.occurredAt))}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{entry.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'meetings' && (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Meetings</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {project.meetings.map((meeting) => (
              <div key={meeting.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{meeting.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dateTimeFormatter.format(new Date(meeting.scheduledFor))}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                      MEETING_STYLES[meeting.status],
                    )}
                  >
                    {meeting.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{meeting.notes}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'action-items' && (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Action items</h2>
          <div className="mt-5 space-y-4">
            {project.actionItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Owner: {item.owner} • Due {dateFormatter.format(new Date(item.dueDate))}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                    ACTION_STYLES[item.status],
                  )}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'files' && (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Files</h2>
          <div className="mt-5 space-y-3">
            {project.files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-sky-600 shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{file.type}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Updated {dateTimeFormatter.format(new Date(file.updatedAt))}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
