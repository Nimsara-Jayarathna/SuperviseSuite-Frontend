import { BlockingState } from '@/components/ui/BlockingState';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { SupervisorStudentSearchResult } from '../../types';

type StudentsStepSectionProps = {
  studentQuery: string;
  searchState: 'idle' | 'loading' | 'results' | 'empty' | 'error';
  searchError: string | null;
  searchResults: SupervisorStudentSearchResult[];
  selectedStudents: SupervisorStudentSearchResult[];
  selectedLeaderId: string | null;
  shouldShowSearchPanel: boolean;
  isSubmitting: boolean;
  step2Valid: boolean;
  buildStudentLabel: (student: SupervisorStudentSearchResult) => string;
  onSetStudentQuery: (query: string) => void;
  onSelectStudent: (student: SupervisorStudentSearchResult) => void;
  onRemoveStudent: (id: string) => void;
  onSetLeaderId: (id: string | null) => void;
  onBack: () => void;
  onNext: () => void;
};

export function StudentsStepSection({
  studentQuery,
  searchState,
  searchError,
  searchResults,
  selectedStudents,
  selectedLeaderId,
  shouldShowSearchPanel,
  isSubmitting,
  step2Valid,
  buildStudentLabel,
  onSetStudentQuery,
  onSelectStudent,
  onRemoveStudent,
  onSetLeaderId,
  onBack,
  onNext,
}: StudentsStepSectionProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-border bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Student assignment</h2>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">
          Search registered students by email and add them to the project.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">
            Search student email
          </span>
          <input
            value={studentQuery}
            onChange={(e) => onSetStudentQuery(e.target.value)}
            placeholder="Type at least 3 characters from the student email"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
            disabled={isSubmitting}
          />
        </label>

        {shouldShowSearchPanel && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <BlockingState
              isActive={searchState === 'loading'}
              mode="inline"
              message="Searching registered students..."
              className="border-0 px-0 py-2"
            />
            {searchState === 'results' && (
              <div className="space-y-2">
                {searchResults.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => onSelectStudent(student)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    disabled={isSubmitting}
                  >
                    <p className="font-medium text-foreground">{buildStudentLabel(student)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{student.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {student.registrationNumber}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {searchState === 'empty' && (
              <p className="px-1 py-2 text-sm text-muted-foreground">
                No registered student found.
              </p>
            )}
            {searchState === 'error' && (
              <p className="px-1 py-2 text-sm text-rose-600">
                {searchError ?? 'Unable to search students right now.'}
              </p>
            )}
          </div>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Selected students</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {selectedStudents.length} selected
            </span>
          </div>
          {selectedStudents.length > 0 ? (
            <div className="mt-3 space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {buildStudentLabel(student)}
                    </span>
                    {selectedLeaderId === student.id ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        Leader
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onRemoveStudent(student.id)}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Remove ${buildStudentLabel(student)}`}
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Project leader (optional)
                </span>
                <Select
                  value={selectedLeaderId ?? ''}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    onSetLeaderId(nextValue.length > 0 ? nextValue : null);
                  }}
                  className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
                  disabled={isSubmitting}
                >
                  <option value="">No leader selected</option>
                  {selectedStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {buildStudentLabel(student)} ({student.registrationNumber})
                    </option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">
                  You can assign or change the leader later from Project Details.
                </p>
              </label>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No students selected yet.</p>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <Button type="button" variant="secondary" size="md" onClick={onBack}>
          ← Back
        </Button>
        <Button type="button" variant="primary" size="md" disabled={!step2Valid} onClick={onNext}>
          Next: Add milestones →
        </Button>
      </div>
    </section>
  );
}
