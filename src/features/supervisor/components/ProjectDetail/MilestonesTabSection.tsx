import {
  CalendarDays,
  Plus,
  Edit2,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FIELD_LIMITS, MILESTONE_STATUS_OPTIONS, dateFormatter } from '../../projectDetails.shared';
import type { MilestonesState } from '../../hooks/useProjectDetailsPageState';
import type { MilestoneStatus } from '../../projectDetails.shared';
import type { SupervisorProjectDetail } from '../../types';

type MilestonesTabSectionProps = {
  project: SupervisorProjectDetail;
  milestones: MilestonesState;
};

function getMilestoneTone(status: MilestoneStatus): any {
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

function getStatusIcon(status: MilestoneStatus, className?: string) {
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

export function MilestonesTabSection({ project, milestones }: MilestonesTabSectionProps) {
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Milestones</h2>
          <p className="text-xs font-medium text-slate-400">
            Total {project.milestones.length} milestones defined
          </p>
        </div>
        {!milestones.isAddingMilestone && (
          <button
            type="button"
            className={buttonStyles({
              variant: 'primary',
              size: 'sm',
              className: 'rounded-xl shadow-lg shadow-indigo-100',
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
          {project.milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 transition-all hover:shadow-lg group ${milestones.editingMilestoneId === milestone.id ? 'ring-2 ring-indigo-400' : ''}`}
            >
              {milestones.editingMilestoneId === milestone.id && milestones.editMilestoneForm ? (
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
                        onChange={(e) => milestones.setEditMilestoneField('title', e.target.value)}
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
                      <select
                        value={milestones.editMilestoneForm.status}
                        onChange={(e) =>
                          milestones.setEditMilestoneField(
                            'status',
                            e.target.value as MilestoneStatus,
                          )
                        }
                        className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none cursor-pointer transition-all focus:border-amber-400"
                      >
                        {MILESTONE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
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
                      disabled={milestones.isSavingMilestone || !milestones.isEditMilestoneDirty}
                    >
                      {milestones.isSavingMilestone ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
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

                        <div className="flex items-center gap-3">
                          <label
                            className={`relative inline-flex cursor-pointer items-center overflow-hidden rounded-2xl bg-slate-100 hover:ring-2 hover:ring-indigo-100 transition-all ${milestones.quickStatusUpdatingId === milestone.id ? 'opacity-50' : ''}`}
                          >
                            <div className={`flex items-center gap-2 pl-3 pr-2 py-1.5`}>
                              {getStatusIcon(milestone.status, 'h-3.5 w-3.5')}
                              <StatusBadge
                                tone={getMilestoneTone(milestone.status)}
                                className="border-none bg-transparent p-0 text-[10px] font-black uppercase tracking-wider"
                              >
                                {milestone.status.replace('_', ' ')}
                              </StatusBadge>
                              <svg
                                className="ml-1 h-3 w-3 text-slate-400"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M3 4.5L6 7.5L9 4.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <select
                              value={milestone.status}
                              disabled={milestones.quickStatusUpdatingId === milestone.id}
                              onChange={(e) =>
                                void milestones.submitQuickMilestoneStatus(
                                  milestone,
                                  e.target.value as MilestoneStatus,
                                )
                              }
                              className="absolute inset-0 w-full cursor-pointer appearance-none opacity-0"
                              aria-label="Change milestone status"
                            >
                              {MILESTONE_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </label>

                          <button
                            type="button"
                            onClick={() => milestones.startEditMilestone(milestone)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:border-amber-200 hover:text-amber-600 hover:shadow-md"
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
          ))}
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
