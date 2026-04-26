import { CalendarDays, Plus, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { buttonStyles } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { parseLocalDateOnly } from '@/lib/dateOnly';
import { FIELD_LIMITS, dateFormatter } from '../../projectDetails.shared';
import {
  getTodayLocalDateString,
  getVisibleMilestoneStatuses,
  isTerminalMilestoneStatus,
} from '../../milestonePolicy';
import { MilestoneStatusDropdown } from './MilestoneStatusDropdown';
import type { MilestonesState } from '../../hooks/useProjectDetailsPageState';
import type { MilestoneStatus } from '../../projectDetails.shared';
import type { SupervisorProjectDetail } from '../../types';

type MilestonesTabSectionProps = {
  project: SupervisorProjectDetail;
  milestones: MilestonesState;
};

export function MilestonesTabSection({ project, milestones }: MilestonesTabSectionProps) {
  const today = getTodayLocalDateString();
  const [openMilestoneId, setOpenMilestoneId] = useState<string | null>(null);

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Milestones</h2>
          <p className="text-xs font-medium text-slate-400">
            Total {project.milestones.length} milestones defined
          </p>
          {project.milestoneInsights ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                Risk: {project.milestoneInsights.timelineRiskLevel}
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700">
                Overdue open: {project.milestoneInsights.overdueOpenMilestones}
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
                Due soon (7d): {project.milestoneInsights.dueSoonCount}
              </span>
            </div>
          ) : null}
        </div>
        {!milestones.isAddingMilestone && (
          <button
            type="button"
            className={buttonStyles({
              variant: 'primary',
              size: 'sm',
              className: 'w-full rounded-xl shadow-lg shadow-indigo-100 sm:w-auto',
            })}
            onClick={milestones.startAddMilestone}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add milestone
          </button>
        )}
      </div>

      {milestones.isAddingMilestone && (
        <form
          className="mt-6 overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50/20 p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300"
          onSubmit={milestones.createMilestone}
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Plus className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700">
              New Milestone
            </h3>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                Title
              </span>
              <input
                required
                placeholder="e.g. Design Sprint"
                maxLength={FIELD_LIMITS.milestoneTitle}
                value={milestones.newMilestoneForm.title}
                onChange={(e) => milestones.setNewMilestoneField('title', e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                Due date
              </span>
              <div className="relative">
                <input
                  required
                  type="date"
                  min={today}
                  value={milestones.newMilestoneForm.dueDate}
                  onChange={(e) => milestones.setNewMilestoneField('dueDate', e.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                Description
              </span>
              <textarea
                placeholder="Briefly describe what this milestone covers..."
                maxLength={FIELD_LIMITS.milestoneDescription}
                rows={3}
                value={milestones.newMilestoneForm.description}
                onChange={(e) => milestones.setNewMilestoneField('description', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={buttonStyles({
                variant: 'secondary',
                size: 'md',
                className: 'rounded-xl',
              })}
              onClick={milestones.cancelAddMilestone}
              disabled={milestones.isSavingMilestone}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={buttonStyles({
                variant: 'primary',
                size: 'md',
                className: 'rounded-xl shadow-lg shadow-indigo-100',
              })}
              disabled={milestones.isSavingMilestone}
            >
              {milestones.isSavingMilestone ? 'Saving...' : 'Create Milestone'}
            </button>
          </div>
        </form>
      )}

      {project.milestones.length > 0 ? (
        <div className="mt-6 space-y-4">
          {project.milestones.map((milestone, index) =>
            (() => {
              const isTerminalMilestone = isTerminalMilestoneStatus(milestone.status);
              const quickStatusOptions = getVisibleMilestoneStatuses({
                currentStatus: milestone.status,
                dueDate: milestone.dueDate,
                today,
              });
              const canOpenQuickStatus = quickStatusOptions.length > 1;
              return (
                <div
                  key={milestone.id}
                  className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:shadow-lg group ${milestones.editingMilestoneId === milestone.id ? 'ring-2 ring-indigo-400' : ''}`}
                >
                  {milestones.editingMilestoneId === milestone.id &&
                  milestones.editMilestoneForm ? (
                    <form
                      className="space-y-5 animate-in fade-in zoom-in-95 duration-200"
                      onSubmit={milestones.saveMilestone}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <Edit2 className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700">
                          Edit Milestone
                        </h3>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                            Title
                          </span>
                          <input
                            required
                            maxLength={FIELD_LIMITS.milestoneTitle}
                            value={milestones.editMilestoneForm.title}
                            onChange={(e) =>
                              milestones.setEditMilestoneField('title', e.target.value)
                            }
                            className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-400"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                            Due date
                          </span>
                          <input
                            required
                            type="date"
                            value={milestones.editMilestoneForm.dueDate}
                            onChange={(e) =>
                              milestones.setEditMilestoneField('dueDate', e.target.value)
                            }
                            className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-400"
                          />
                        </label>
                        <label className="space-y-1.5 sm:col-span-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                            Status
                          </span>
                          {(() => {
                            const visibleStatusOptions = getVisibleMilestoneStatuses({
                              currentStatus: milestone.status,
                              dueDate: milestones.editMilestoneForm?.dueDate ?? milestone.dueDate,
                              today,
                            });
                            const isStatusSelectDisabled =
                              visibleStatusOptions.length <= 1 || isTerminalMilestone;
                            return (
                              <Select
                                value={milestones.editMilestoneForm.status}
                                onChange={(e) =>
                                  milestones.setEditMilestoneField(
                                    'status',
                                    e.target.value as MilestoneStatus,
                                  )
                                }
                                disabled={isStatusSelectDisabled}
                                className={`h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition-all focus:border-amber-400 ${isStatusSelectDisabled ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer'}`}
                              >
                                {visibleStatusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status.replace('_', ' ')}
                                  </option>
                                ))}
                              </Select>
                            );
                          })()}
                        </label>
                        <label className="space-y-1.5 sm:col-span-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                            Description
                          </span>
                          <textarea
                            maxLength={FIELD_LIMITS.milestoneDescription}
                            rows={3}
                            value={milestones.editMilestoneForm.description}
                            onChange={(e) =>
                              milestones.setEditMilestoneField('description', e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-amber-400"
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <button
                          type="button"
                          className={buttonStyles({
                            variant: 'secondary',
                            size: 'sm',
                            className: 'rounded-xl',
                          })}
                          onClick={milestones.cancelEditMilestone}
                          disabled={milestones.isSavingMilestone}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={buttonStyles({
                            variant: 'primary',
                            size: 'sm',
                            className: 'rounded-xl',
                          })}
                          disabled={
                            milestones.isSavingMilestone || !milestones.isEditMilestoneDirty
                          }
                        >
                          {milestones.isSavingMilestone ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex shrink-0 items-start justify-center pt-0.5 sm:items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-base font-black text-slate-400 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            {String(milestone.sequenceNo).padStart(2, '0')}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                            <div className="flex flex-col">
                              <h4 className="line-clamp-2 text-base font-black tracking-tight text-slate-800 transition-colors group-hover:text-indigo-900 sm:text-lg sm:line-clamp-1">
                                {milestone.title}
                              </h4>
                              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {(() => {
                                  const dueDate = parseLocalDateOnly(milestone.dueDate);
                                  return (
                                    <span>
                                      Due{' '}
                                      {dueDate ? dateFormatter.format(dueDate) : milestone.dueDate}
                                    </span>
                                  );
                                })()}
                                {milestone.isOverdue ? (
                                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-rose-700">
                                    {milestone.daysOverdue && milestone.daysOverdue > 0
                                      ? `${milestone.daysOverdue}d overdue`
                                      : 'Overdue'}
                                  </span>
                                ) : null}
                                {milestone.isChronologyViolation ? (
                                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-700">
                                    Chronology issue
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                              <MilestoneStatusDropdown
                                value={milestone.status}
                                visibleOptions={quickStatusOptions}
                                disabled={
                                  milestones.quickStatusUpdatingId === milestone.id ||
                                  !canOpenQuickStatus
                                }
                                isOpen={openMilestoneId === milestone.id}
                                onOpenChange={(nextOpen) => {
                                  setOpenMilestoneId(nextOpen ? milestone.id : null);
                                }}
                                onSelect={(nextStatus) => {
                                  void milestones.submitQuickMilestoneStatus(milestone, nextStatus);
                                }}
                              />

                              <button
                                type="button"
                                title={
                                  isTerminalMilestone
                                    ? 'Terminal milestones cannot be edited.'
                                    : 'Edit milestone'
                                }
                                onClick={() => {
                                  if (!isTerminalMilestone) {
                                    milestones.startEditMilestone(milestone);
                                  }
                                }}
                                disabled={isTerminalMilestone}
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border bg-white shadow-sm transition-all ${isTerminalMilestone ? 'cursor-not-allowed border-slate-100 text-slate-300 opacity-60' : 'border-slate-100 text-slate-400 hover:border-amber-200 hover:text-amber-600 hover:shadow-md'}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-slate-500 line-clamp-2">
                            {milestone.description ?? 'No description provided for this milestone.'}
                          </p>
                        </div>
                      </div>

                      {/* Subtle progress line indicator if needed */}
                      {index < project.milestones.length - 1 && (
                        <div className="absolute left-[3.5rem] bottom-0 top-[4.5rem] w-0.5 bg-slate-50 -z-10 group-hover:bg-indigo-50/50" />
                      )}
                    </>
                  )}
                </div>
              );
            })(),
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm font-bold text-slate-400">
            No milestones defined for this project yet.
          </p>
        </div>
      )}
    </section>
  );
}
