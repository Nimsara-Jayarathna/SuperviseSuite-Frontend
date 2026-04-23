import type { MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import {
  FIELD_LIMITS,
  collapsePreview,
  isMilestoneComplete,
  milestoneSummaryDate,
  milestoneSummaryDescription,
  milestoneSummaryTitle,
} from '../../createProject.shared';
import { getTodayLocalDateString } from '../../milestonePolicy';
import type { MilestoneDraft } from '../../createProject.shared';

type MilestonesStepSectionProps = {
  milestones: MilestoneDraft[];
  expandedMilestoneIndex: number | null;
  milestoneRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  isSubmitting: boolean;
  submitError: string | null;
  showIncompleteHint: boolean;
  step3Valid: boolean;
  milestonePolicyError: string | null;
  incompleteMilestoneCount: number;
  onUpdateMilestone: <F extends keyof MilestoneDraft>(
    index: number,
    field: F,
    value: MilestoneDraft[F],
  ) => void;
  onToggleMilestone: (index: number) => void;
  onRemoveMilestone: (index: number) => void;
  onAddMilestone: () => void;
  onBack: () => void;
  onShowIncompleteHint: () => void;
};

function CharLimit({ current, max }: { current: number; max: number }) {
  return (
    <span className="text-xs text-muted-foreground">
      {current}/{max} characters
    </span>
  );
}

export function MilestonesStepSection({
  milestones,
  expandedMilestoneIndex,
  milestoneRefs,
  isSubmitting,
  submitError,
  showIncompleteHint,
  step3Valid,
  milestonePolicyError,
  incompleteMilestoneCount,
  onUpdateMilestone,
  onToggleMilestone,
  onRemoveMilestone,
  onAddMilestone,
  onBack,
  onShowIncompleteHint,
}: MilestonesStepSectionProps) {
  const today = getTodayLocalDateString();

  return (
    <section className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Project milestones</h2>
          <p className="mt-1 text-sm leading-7 text-muted-foreground">
            Add all milestones now. The project will be created in one request when you submit.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {milestones.length} milestone{milestones.length === 1 ? '' : 's'} added
        </span>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone, index) => {
          const isExpanded = expandedMilestoneIndex === index;
          const isComplete = isMilestoneComplete(milestone);
          const date = milestoneSummaryDate(milestone);

          return (
            <div
              key={index}
              ref={(el) => {
                milestoneRefs.current[index] = el;
              }}
              className={[
                'rounded-3xl border bg-white transition-all duration-200',
                isExpanded
                  ? 'border-slate-300 shadow-[0_10px_24px_rgba(15,23,42,0.08)]'
                  : isComplete
                    ? 'border-slate-200 hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]'
                    : 'border-amber-200 bg-amber-50/30',
              ].join(' ')}
            >
              {isExpanded ? (
                <div className="p-5 sm:p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <button
                      type="button"
                      onClick={() => onToggleMilestone(index)}
                      className="flex items-center gap-2.5 text-left"
                      aria-label="Collapse milestone"
                    >
                      <span className="inline-flex h-8 items-center rounded-lg bg-slate-100 px-2.5 text-xs font-semibold tracking-[0.12em] text-slate-700">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        Milestone {index + 1}
                      </span>
                      {!isComplete && (
                        <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                          Incomplete
                        </span>
                      )}
                      {isComplete && (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M1.5 5L3.5 7L8.5 3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Complete
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveMilestone(index)}
                          className="inline-flex h-8 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-5 pt-1">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <label className="block min-w-0 flex-1">
                        <span className="mb-2 block text-sm font-medium text-slate-800">Title</span>
                        <input
                          required
                          value={milestone.title}
                          onChange={(e) => onUpdateMilestone(index, 'title', e.target.value)}
                          maxLength={FIELD_LIMITS.milestoneTitle}
                          placeholder="e.g. Proposal Submission"
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-colors focus:border-slate-400"
                          disabled={isSubmitting}
                        />
                      </label>

                      <label className="block shrink-0 sm:w-[200px]">
                        <span className="mb-2 block text-sm font-medium text-slate-800">
                          Due date
                        </span>
                        <input
                          required
                          type="date"
                          min={today}
                          value={milestone.dueDate}
                          onChange={(e) => onUpdateMilestone(index, 'dueDate', e.target.value)}
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-colors focus:border-slate-400"
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 flex items-center justify-between text-sm font-medium text-slate-800">
                        <span>Description</span>
                        <CharLimit
                          current={milestone.description.length}
                          max={FIELD_LIMITS.milestoneDescription}
                        />
                      </span>
                      <textarea
                        value={milestone.description}
                        onChange={(e) => onUpdateMilestone(index, 'description', e.target.value)}
                        maxLength={FIELD_LIMITS.milestoneDescription}
                        placeholder="Add context or review expectations."
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400"
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <button
                    type="button"
                    onClick={() => onToggleMilestone(index)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    disabled={isSubmitting}
                    aria-label={`Expand milestone ${index + 1}`}
                  >
                    <div
                      className={[
                        'flex h-9 shrink-0 items-center justify-center rounded-lg px-2.5 text-xs font-semibold tracking-[0.12em]',
                        isComplete
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      {isComplete ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2.5 7L5.5 10L11.5 4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        String(index + 1).padStart(2, '0')
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {milestoneSummaryTitle(milestone)}
                        </span>
                        {date && <span className="text-xs text-slate-400">{date}</span>}
                        {!isComplete && (
                          <span className="w-fit rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                            Incomplete
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {collapsePreview(milestoneSummaryDescription(milestone))}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveMilestone(index)}
                        className="inline-flex h-8 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddMilestone}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-foreground"
        disabled={isSubmitting}
      >
        <span className="text-base leading-none">+</span>
        Add another milestone
      </button>

      {submitError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      )}
      {milestonePolicyError && !submitError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {milestonePolicyError}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onBack}
          disabled={isSubmitting}
        >
          ← Back
        </Button>
        <div className="flex flex-col items-end gap-2">
          {showIncompleteHint && !step3Valid && (
            <p className="text-xs text-amber-700">
              {incompleteMilestoneCount > 0
                ? `Complete ${incompleteMilestoneCount} milestone${incompleteMilestoneCount === 1 ? '' : 's'} before creating the project.`
                : (milestonePolicyError ??
                  'Milestone rules must be fixed before creating the project.')}
            </p>
          )}
          <div className="flex gap-3">
            <Link
              to="/supervisor/projects"
              className={buttonStyles({ variant: 'secondary', size: 'md' })}
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              onClick={onShowIncompleteHint}
            >
              {isSubmitting ? 'Creating...' : 'Create project'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
