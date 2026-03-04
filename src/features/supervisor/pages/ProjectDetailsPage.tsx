import { useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  FileText,
  FolderGit2,
  Link as LinkIcon,
  MessageSquareMore,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useSupervisorWorkspace } from '../hooks/useSupervisorWorkspace';
import type { SupervisorProjectLifecycle, SupervisorProjectTab } from '../types';

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

const TABS: SupervisorProjectTab[] = [
  'overview',
  'team',
  'activity',
  'meetings',
  'action-items',
  'files',
];

const LIFECYCLE_OPTIONS: SupervisorProjectLifecycle[] = [
  'PLANNING',
  'ACTIVE',
  'AT_RISK',
  'BEHIND',
  'COMPLETED',
];

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { getProjectById } = useSupervisorWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const project = projectId ? getProjectById(projectId) : null;
  const [lifecycleDraft, setLifecycleDraft] = useState<SupervisorProjectLifecycle>(
    project?.lifecycle ?? 'PLANNING',
  );

  const requestedTab = searchParams.get('tab') as SupervisorProjectTab | null;
  const activeTab = requestedTab && TABS.includes(requestedTab) ? requestedTab : 'overview';

  if (!project) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Project not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The requested supervisor project could not be resolved from the current workspace.
        </p>
        <Link
          to="/supervisor/projects"
          className={buttonStyles({ variant: 'primary', size: 'md', className: 'mt-6' })}
        >
          Back to projects
        </Link>
      </div>
    );
  }

  function handleTabChange(tab: SupervisorProjectTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') nextParams.delete('tab');
    else nextParams.set('tab', tab);
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.title}
        subtitle={project.summary}
        actions={
          <>
            <Button type="button" variant="primary" size="md">
              Add meeting
            </Button>
            <Button type="button" variant="secondary" size="md">
              Upload file
            </Button>
          </>
        }
      />

      <section className="flex flex-wrap gap-3">
        <StatusBadge
          tone={
            lifecycleDraft === 'ACTIVE'
              ? 'success'
              : lifecycleDraft === 'AT_RISK'
                ? 'warning'
                : lifecycleDraft === 'BEHIND'
                  ? 'danger'
                  : lifecycleDraft === 'COMPLETED'
                    ? 'neutral'
                    : 'student'
          }
        >
          {lifecycleDraft.replace('_', ' ')}
        </StatusBadge>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <CalendarDays className="h-4 w-4" />
          Milestone {dateFormatter.format(new Date(project.milestoneDate))}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <BarChart3 className="h-4 w-4" />
          Progress {project.progress}%
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
        items={TABS.map((tab) => ({
          value: tab,
          label: tab.replace('-', ' '),
        }))}
        value={activeTab}
        onChange={(value) => handleTabChange(value as SupervisorProjectTab)}
        tone="supervisor"
      />

      {activeTab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Project summary</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Batch</p>
                  <p className="mt-1 font-medium text-foreground">{project.batch}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Semester
                  </p>
                  <p className="mt-1 font-medium text-foreground">{project.semester}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Health note
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">
                    {project.healthNote}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Highlights</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                {project.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Lifecycle control</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This selector currently updates the UI state only. Wire it to the backend transition
                flow next.
              </p>
              <select
                value={lifecycleDraft}
                onChange={(event) =>
                  setLifecycleDraft(event.target.value as SupervisorProjectLifecycle)
                }
                className="mt-4 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
              >
                {LIFECYCLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <aside className="space-y-6">
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
                      Communication
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
      ) : null}

      {activeTab === 'team' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Team</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {project.members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-medium text-foreground">{member.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'activity' ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Activity timeline</h2>
            <div className="mt-5 space-y-4">
              {project.events.map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {dateTimeFormatter.format(new Date(event.occurredAt))}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{event.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Contribution snapshot</h2>
            <div className="mt-5 space-y-4">
              {project.contributions.map((contribution) => {
                const member = project.members.find((item) => item.id === contribution.memberId);
                return (
                  <div
                    key={contribution.memberId}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-medium text-foreground">
                      {member?.name ?? contribution.memberId}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Commits: {contribution.commits} • PRs: {contribution.pullRequests}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Last 6 weeks
              </p>
              <div className="mt-3 flex items-end gap-2">
                {project.activityWeeks.map((value, index) => (
                  <div
                    key={`${project.id}-week-${index}`}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-t-xl bg-amber-400"
                      style={{ height: `${Math.max(20, value * 8)}px` }}
                    />
                    <span className="text-xs text-muted-foreground">W{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'meetings' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground">Meetings</h2>
            <Button type="button" variant="primary" size="md">
              Add meeting minutes
            </Button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Summary</th>
                </tr>
              </thead>
              <tbody>
                {project.meetings.map((meeting) => (
                  <tr key={meeting.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-4 font-medium text-foreground">{meeting.title}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {dateTimeFormatter.format(new Date(meeting.scheduledFor))}
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{meeting.status}</td>
                    <td className="px-3 py-4 text-muted-foreground">{meeting.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'action-items' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Action items</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Task</th>
                  <th className="px-3 py-3">Assignee</th>
                  <th className="px-3 py-3">Due</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Jira</th>
                </tr>
              </thead>
              <tbody>
                {project.actionItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-4 font-medium text-foreground">{item.title}</td>
                    <td className="px-3 py-4 text-muted-foreground">{item.assignee}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {dateFormatter.format(new Date(item.dueDate))}
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{item.priority}</td>
                    <td className="px-3 py-4 text-muted-foreground">{item.status}</td>
                    <td className="px-3 py-4 text-muted-foreground">{item.jiraKey ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'files' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground">Files</h2>
            <Button type="button" variant="secondary" size="md">
              Upload file
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {project.files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {file.type} • {file.sizeLabel}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Uploaded by {file.uploadedBy}</p>
                  <p className="mt-1">
                    Updated {dateTimeFormatter.format(new Date(file.updatedAt))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
