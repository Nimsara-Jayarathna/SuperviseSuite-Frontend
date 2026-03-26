import { Button } from '@/components/ui/Button';
import { FIELD_LIMITS } from '../../createProject.shared';
import type { DraftState } from '../../createProject.shared';

type BasicsStepSectionProps = {
  draft: DraftState;
  step1Valid: boolean;
  isSubmitting: boolean;
  onUpdateDraft: <F extends keyof DraftState>(field: F, value: DraftState[F]) => void;
  onNext: () => void;
};

function CharLimit({ current, max }: { current: number; max: number }) {
  return (
    <span className="text-xs text-muted-foreground">
      {current}/{max} characters
    </span>
  );
}

export function BasicsStepSection({
  draft,
  step1Valid,
  isSubmitting,
  onUpdateDraft,
  onNext,
}: BasicsStepSectionProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Project basics</h2>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">
          Capture the core project details.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-foreground">Project title</span>
        <input
          required
          value={draft.title}
          onChange={(e) => onUpdateDraft('title', e.target.value)}
          maxLength={FIELD_LIMITS.title}
          placeholder="e.g. Smart Attendance Tracker"
          className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
          disabled={isSubmitting}
        />
      </label>

      <label className="block">
        <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-foreground">
          <span>Summary</span>
          <CharLimit current={draft.summary.length} max={FIELD_LIMITS.summary} />
        </span>
        <textarea
          required
          value={draft.summary}
          onChange={(e) => onUpdateDraft('summary', e.target.value)}
          maxLength={FIELD_LIMITS.summary}
          placeholder="Describe the project scope, purpose, and expected outcome."
          rows={5}
          className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
          disabled={isSubmitting}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Batch</span>
          <input
            required
            value={draft.batch}
            onChange={(e) => onUpdateDraft('batch', e.target.value)}
            maxLength={FIELD_LIMITS.batch}
            className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
            disabled={isSubmitting}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Semester</span>
          <input
            required
            value={draft.semester}
            onChange={(e) => onUpdateDraft('semester', e.target.value)}
            maxLength={FIELD_LIMITS.semester}
            className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
            disabled={isSubmitting}
          />
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="primary" size="md" disabled={!step1Valid} onClick={onNext}>
          Next: Assign students →
        </Button>
      </div>
    </section>
  );
}
