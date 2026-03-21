import { buttonStyles } from '@/components/ui/Button';
import {
  FIELD_LIMITS,
  MILESTONE_STATUS_OPTIONS,
  dateFormatter,
  milestoneStatusBg,
  milestoneStatusLabel,
  milestoneStatusPill,
} from '../../projectDetails.shared';
import type { MilestonesState } from '../../hooks/useProjectDetailsPageState';
import type { MilestoneStatus } from '../../projectDetails.shared';
import type { SupervisorProjectDetail } from '../../types';

type MilestonesTabSectionProps = {
  project: SupervisorProjectDetail;
  milestones: MilestonesState;
};

export function MilestonesTabSection({ project, milestones }: MilestonesTabSectionProps) {
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Milestones</h2>
        {!milestones.isAddingMilestone && (
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={milestones.startAddMilestone}
          >
            Add milestone
          </button>
        )}
      </div>

      {milestones.isAddingMilestone && (
        <form
          className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          onSubmit={milestones.createMilestone}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Title
              </span>
              <input
                required
                maxLength={FIELD_LIMITS.milestoneTitle}
                value={milestones.newMilestoneForm.title}
                onChange={(e) => milestones.setNewMilestoneField('title', e.target.value)}
                className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Due date
              </span>
              <input
                required
                type="date"
                value={milestones.newMilestoneForm.dueDate}
                onChange={(e) => milestones.setNewMilestoneField('dueDate', e.target.value)}
                className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Description
              </span>
              <textarea
                maxLength={FIELD_LIMITS.milestoneDescription}
                rows={3}
                value={milestones.newMilestoneForm.description}
                onChange={(e) => milestones.setNewMilestoneField('description', e.target.value)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              onClick={milestones.cancelAddMilestone}
              disabled={milestones.isSavingMilestone}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
              disabled={milestones.isSavingMilestone}
            >
              {milestones.isSavingMilestone ? 'Saving...' : 'Add milestone'}
            </button>
          </div>
        </form>
      )}

      {project.milestones.length > 0 ? (
        <div className="mt-5 space-y-3">
          {project.milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`rounded-2xl border p-4 transition-colors ${milestoneStatusBg(milestone.status)}`}
            >
              {milestones.editingMilestoneId === milestone.id && milestones.editMilestoneForm ? (
                <form className="space-y-3" onSubmit={milestones.saveMilestone}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Title
                      </span>
                      <input
                        required
                        maxLength={FIELD_LIMITS.milestoneTitle}
                        value={milestones.editMilestoneForm.title}
                        onChange={(e) => milestones.setEditMilestoneField('title', e.target.value)}
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Due date
                      </span>
                      <input
                        required
                        type="date"
                        value={milestones.editMilestoneForm.dueDate}
                        onChange={(e) =>
                          milestones.setEditMilestoneField('dueDate', e.target.value)
                        }
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Status
                      </span>
                      <select
                        value={milestones.editMilestoneForm.status}
                        onChange={(e) =>
                          milestones.setEditMilestoneField(
                            'status',
                            e.target.value as MilestoneStatus,
                          )
                        }
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                      >
                        {MILESTONE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Description
                      </span>
                      <textarea
                        maxLength={FIELD_LIMITS.milestoneDescription}
                        rows={3}
                        value={milestones.editMilestoneForm.description}
                        onChange={(e) =>
                          milestones.setEditMilestoneField('description', e.target.value)
                        }
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                      onClick={milestones.cancelEditMilestone}
                      disabled={milestones.isSavingMilestone}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={buttonStyles({ variant: 'primary', size: 'sm' })}
                      disabled={milestones.isSavingMilestone || !milestones.isEditMilestoneDirty}
                    >
                      {milestones.isSavingMilestone ? 'Saving...' : 'Save milestone'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <p className="min-w-0 flex-1 truncate font-semibold text-foreground">
                      {milestone.sequenceNo}. {milestone.title}
                    </p>
                    <p className="w-36 shrink-0 text-right text-sm text-muted-foreground">
                      Due {dateFormatter.format(new Date(milestone.dueDate))}
                    </p>
                    <label
                      className={`inline-flex w-36 shrink-0 cursor-pointer items-center justify-between rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-opacity ${milestoneStatusPill(milestone.status)} ${milestones.quickStatusUpdatingId === milestone.id ? 'opacity-50' : ''}`}
                    >
                      <select
                        value={milestone.status}
                        disabled={milestones.quickStatusUpdatingId === milestone.id}
                        onChange={(e) =>
                          void milestones.submitQuickMilestoneStatus(
                            milestone,
                            e.target.value as MilestoneStatus,
                          )
                        }
                        className="w-full cursor-pointer appearance-none bg-transparent outline-none"
                        aria-label="Change milestone status"
                      >
                        {MILESTONE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {milestoneStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="ml-1 h-3 w-3 shrink-0 opacity-60"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 4.5L6 7.5L9 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </label>
                    <button
                      type="button"
                      onClick={() => milestones.startEditMilestone(milestone)}
                      className="inline-flex h-8 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      Edit
                    </button>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {milestone.description ?? 'No description provided.'}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No milestones recorded yet.</p>
      )}
    </section>
  );
}
