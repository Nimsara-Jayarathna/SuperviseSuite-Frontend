import { CalendarDays } from 'lucide-react';
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

export function OverviewTabSection({ project, overview }: OverviewTabSectionProps) {
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
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Health note
                </p>
                <div className="mt-2 rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50">
                  <p className="text-sm leading-relaxed text-slate-600">
                    {project.healthNote ?? 'No health note recorded yet.'}
                  </p>
                </div>
              </div>
              <div className="sm:col-span-2">
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
          <h2 className="text-lg font-semibold text-foreground">Current scope</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            This detail view currently shows only backend-backed project data: core project fields,
            assigned members, and milestone records. Workflow features such as meetings, files,
            action items, and integrations are not part of this endpoint yet.
          </p>
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
  );
}
