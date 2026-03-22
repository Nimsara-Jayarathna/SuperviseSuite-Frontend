import { buttonStyles } from '@/components/ui/Button';
import { RepositorySection } from './RepositorySection';
import { FIELD_LIMITS, LIFECYCLE_OPTIONS, dateFormatter } from '../../projectDetails.shared';
import type { OverviewState } from '../../hooks/useProjectDetailsPageState';
import type { SupervisorProjectDetail, SupervisorProjectLifecycle } from '../../types';

type OverviewTabSectionProps = {
  project: SupervisorProjectDetail;
  overview: OverviewState;
  onProjectUpdate: (updatedProject: SupervisorProjectDetail) => void;
  pendingGitHubInstallationId?: number | null;
  onPendingGitHubInstallationHandled?: () => void;
};

export function OverviewTabSection({
  project,
  overview,
  onProjectUpdate,
  pendingGitHubInstallationId,
  onPendingGitHubInstallationHandled,
}: OverviewTabSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <section className="space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Project summary</h2>
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
                  <select
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
                  </select>
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
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Batch</p>
                <p className="mt-1 font-medium text-foreground">{project.batch ?? 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Semester</p>
                <p className="mt-1 font-medium text-foreground">{project.semester ?? 'Not set'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Summary</p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  {project.summary ?? 'No summary recorded yet.'}
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

        <RepositorySection
          project={project}
          onUpdate={onProjectUpdate}
          pendingInstallationId={pendingGitHubInstallationId}
          onPendingInstallationHandled={onPendingGitHubInstallationHandled}
        />

        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Current scope</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            This detail view currently shows only backend-backed project data: core project fields,
            assigned members, and milestone records. Workflow features such as meetings, files,
            action items, and integrations are not part of this endpoint yet.
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
  );
}
