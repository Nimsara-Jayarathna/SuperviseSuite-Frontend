import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, Clock3, Users } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { supervisorApi } from '../api/supervisorApi';
import { ProjectDetailsSkeleton } from '../components/ProjectDetailsSkeleton';
import { useSupervisorProject } from '../hooks/useSupervisorProject';
import type {
  SupervisorProjectDetail,
  SupervisorProjectDetailMember,
  SupervisorProjectDetailTab,
  SupervisorProjectLifecycle,
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

const TABS: SupervisorProjectDetailTab[] = ['overview', 'team', 'milestones'];
const LIFECYCLE_OPTIONS: SupervisorProjectLifecycle[] = [
  'PLANNING',
  'ACTIVE',
  'AT_RISK',
  'BEHIND',
  'COMPLETED',
];

type OverviewEditForm = {
  title: string;
  summary: string;
  batch: string;
  semester: string;
  lifecycleStatus: SupervisorProjectLifecycle;
  healthNote: string;
};

function memberDisplayName(member: SupervisorProjectDetailMember) {
  return `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.email;
}

function lifecycleTone(status: string) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'AT_RISK') return 'warning';
  if (status === 'BEHIND') return 'danger';
  if (status === 'COMPLETED') return 'neutral';
  return 'student';
}

function buildOverviewEditForm(project: SupervisorProjectDetail): OverviewEditForm {
  return {
    title: project.title,
    summary: project.summary ?? '',
    batch: project.batch ?? '',
    semester: project.semester ?? '',
    lifecycleStatus: project.lifecycleStatus,
    healthNote: project.healthNote ?? '',
  };
}

function toNullableTrimmed(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project, isLoading, error, reload } = useSupervisorProject(projectId);
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [isSavingOverview, setIsSavingOverview] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [overviewForm, setOverviewForm] = useState<OverviewEditForm | null>(null);

  const requestedTab = searchParams.get('tab') as SupervisorProjectDetailTab | null;
  const activeTab = requestedTab && TABS.includes(requestedTab) ? requestedTab : 'overview';
  const initialOverviewForm = project ? buildOverviewEditForm(project) : null;
  const isOverviewDirty =
    overviewForm !== null &&
    initialOverviewForm !== null &&
    (overviewForm.title !== initialOverviewForm.title ||
      overviewForm.summary !== initialOverviewForm.summary ||
      overviewForm.batch !== initialOverviewForm.batch ||
      overviewForm.semester !== initialOverviewForm.semester ||
      overviewForm.lifecycleStatus !== initialOverviewForm.lifecycleStatus ||
      overviewForm.healthNote !== initialOverviewForm.healthNote);

  useEffect(() => {
    if (project && !isEditingOverview) {
      setOverviewForm(buildOverviewEditForm(project));
    }
  }, [project, isEditingOverview]);

  function handleTabChange(tab: SupervisorProjectDetailTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }
    setSearchParams(nextParams, { replace: true });
  }

  function handleStartOverviewEdit() {
    if (!project) {
      return;
    }
    setOverviewForm(buildOverviewEditForm(project));
    setSaveError(null);
    setIsEditingOverview(true);
  }

  function handleCancelOverviewEdit() {
    if (project) {
      setOverviewForm(buildOverviewEditForm(project));
    }
    setSaveError(null);
    setIsEditingOverview(false);
  }

  async function handleSaveOverview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !overviewForm || !projectId) {
      return;
    }

    setIsSavingOverview(true);
    setSaveError(null);

    try {
      await supervisorApi.updateProject(projectId, {
        title: overviewForm.title.trim(),
        summary: overviewForm.summary.trim(),
        batch: overviewForm.batch.trim(),
        semester: overviewForm.semester.trim(),
        lifecycleStatus: overviewForm.lifecycleStatus,
        healthNote: toNullableTrimmed(overviewForm.healthNote),
      });
      await reload();
      setIsEditingOverview(false);
    } catch (saveException) {
      setSaveError(
        isApiException(saveException)
          ? saveException.apiError
          : {
              code: 'INTERNAL_ERROR',
              message: 'Unable to update the project right now.',
              details: [],
              timestamp: new Date().toISOString(),
              status: 0,
              error: 'Unexpected Error',
              path: '',
              traceId: null,
            },
      );
    } finally {
      setIsSavingOverview(false);
    }
  }

  if (isLoading) {
    return <ProjectDetailsSkeleton />;
  }

  if (error) {
    if (error.code === 'NOT_FOUND') {
      return (
        <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Project not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested supervisor project could not be found or is not available to your account.
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
        <StatusBadge tone={lifecycleTone(project.lifecycleStatus)}>
          {project.lifecycleStatus.replace('_', ' ')}
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
          label: tab,
        }))}
        value={activeTab}
        onChange={(value) => handleTabChange(value as SupervisorProjectDetailTab)}
        tone="supervisor"
      />

      {activeTab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">Project summary</h2>
                {!isEditingOverview ? (
                  <button
                    type="button"
                    className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                    onClick={handleStartOverviewEdit}
                  >
                    Edit details
                  </button>
                ) : null}
              </div>

              {isEditingOverview && overviewForm ? (
                <form className="mt-5 space-y-4" onSubmit={handleSaveOverview}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Title
                      </span>
                      <input
                        required
                        maxLength={40}
                        value={overviewForm.title}
                        onChange={(event) =>
                          setOverviewForm((current) =>
                            current ? { ...current, title: event.target.value } : current,
                          )
                        }
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Lifecycle
                      </span>
                      <select
                        value={overviewForm.lifecycleStatus}
                        onChange={(event) =>
                          setOverviewForm((current) =>
                            current
                              ? {
                                  ...current,
                                  lifecycleStatus: event.target.value as SupervisorProjectLifecycle,
                                }
                              : current,
                          )
                        }
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                      >
                        {LIFECYCLE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Batch
                      </span>
                      <input
                        required
                        maxLength={32}
                        value={overviewForm.batch}
                        onChange={(event) =>
                          setOverviewForm((current) =>
                            current ? { ...current, batch: event.target.value } : current,
                          )
                        }
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Semester
                      </span>
                      <input
                        required
                        maxLength={32}
                        value={overviewForm.semester}
                        onChange={(event) =>
                          setOverviewForm((current) =>
                            current ? { ...current, semester: event.target.value } : current,
                          )
                        }
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1.5 sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Summary
                      </span>
                      <textarea
                        required
                        maxLength={250}
                        rows={4}
                        value={overviewForm.summary}
                        onChange={(event) =>
                          setOverviewForm((current) =>
                            current ? { ...current, summary: event.target.value } : current,
                          )
                        }
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1.5 sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Health note
                      </span>
                      <textarea
                        maxLength={250}
                        rows={3}
                        value={overviewForm.healthNote}
                        onChange={(event) =>
                          setOverviewForm((current) =>
                            current ? { ...current, healthNote: event.target.value } : current,
                          )
                        }
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                      />
                    </label>
                  </div>

                  {saveError ? <p className="text-sm text-rose-600">{saveError.message}</p> : null}

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={isSavingOverview}
                      className={buttonStyles({ variant: 'secondary', size: 'md' })}
                      onClick={handleCancelOverviewEdit}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingOverview || !isOverviewDirty}
                      className={buttonStyles({ variant: 'primary', size: 'md' })}
                    >
                      {isSavingOverview ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Batch
                    </p>
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
                      Summary
                    </p>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      {project.summary ?? 'No summary has been recorded for this project yet.'}
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
              )}
            </div>

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Current scope</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                This detail view currently shows only backend-backed project data: core project
                fields, assigned members, and milestone records. Workflow features such as meetings,
                files, action items, and integrations are not part of this endpoint yet.
              </p>
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
