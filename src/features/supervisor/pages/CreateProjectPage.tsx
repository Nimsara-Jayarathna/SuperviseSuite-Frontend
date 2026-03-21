import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BlockingState } from '@/components/ui/BlockingState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import { ProjectStepper } from '../components/ProjectStepper';
import { invalidateSupervisorProjectsCache } from '../hooks/useSupervisorProjects';
import type { CreateSupervisorProjectResponse, SupervisorStudentSearchResult } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type DraftState = {
  title: string;
  batch: string;
  semester: string;
  summary: string;
};

type MilestoneDraft = {
  title: string;
  description: string;
  dueDate: string;
};

type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_DRAFT: DraftState = {
  title: '',
  batch: '2026',
  semester: 'Semester 1',
  summary: '',
};

const INITIAL_MILESTONE: MilestoneDraft = {
  title: '',
  description: '',
  dueDate: '',
};

const FIELD_LIMITS = {
  title: 40,
  batch: 32,
  semester: 32,
  summary: 250,
  milestoneTitle: 40,
  milestoneDescription: 250,
} as const;

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

// ─── Stepper config ───────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1 as const,
    label: 'Project basics',
    description: 'Capture the core project information first.',
  },
  {
    id: 2 as const,
    label: 'Student assignment',
    description: 'Choose the registered students assigned to this project.',
  },
  {
    id: 3 as const,
    label: 'Milestones',
    description: 'Add every milestone now, then create the project in one final request.',
  },
];

type StepId = (typeof STEPS)[number]['id'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildStudentLabel(student: SupervisorStudentSearchResult) {
  return `${student.firstName} ${student.lastName}`.trim() || student.email;
}

function isMilestoneComplete(milestone: MilestoneDraft) {
  return milestone.title.trim().length > 0 && milestone.dueDate.length > 0;
}

function milestoneSummaryTitle(milestone: MilestoneDraft) {
  const title = milestone.title.trim();
  return title.length > 0 ? title : 'Untitled milestone';
}

function milestoneSummaryDescription(milestone: MilestoneDraft) {
  const description = milestone.description.trim();
  if (description.length > 0) return description;
  return isMilestoneComplete(milestone) ? 'No description added.' : 'Needs a title and due date.';
}

// FIX 2: Don't render date in uppercase alarming style — return null if empty
function milestoneSummaryDate(milestone: MilestoneDraft): string | null {
  if (!milestone.dueDate) return null;
  return dateFormatter.format(new Date(milestone.dueDate));
}

function collapsePreview(text: string, maxChars = 60) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}...`;
}

function earliestMilestone(
  milestones: CreateSupervisorProjectResponse['milestones'],
): CreateSupervisorProjectResponse['milestones'][number] | null {
  if (milestones.length === 0) return null;
  return milestones.reduce((earliest, milestone) =>
    new Date(milestone.dueDate).getTime() < new Date(earliest.dueDate).getTime()
      ? milestone
      : earliest,
  );
}

function CharLimit({ current, max }: { current: number; max: number }) {
  return (
    <span className="text-xs text-muted-foreground">
      {current}/{max} characters
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CreateProjectPage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [draft, setDraft] = useState<DraftState>(INITIAL_DRAFT);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([{ ...INITIAL_MILESTONE }]);
  const [expandedMilestoneIndex, setExpandedMilestoneIndex] = useState<number | null>(0);

  // FIX 3: ref map for scroll-into-view on new milestone
  const milestoneRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<SupervisorStudentSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<SupervisorStudentSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showIncompleteHint, setShowIncompleteHint] = useState(false); // FIX 7
  const [createdProject, setCreatedProject] = useState<CreateSupervisorProjectResponse | null>(null);
  const [requestModal, setRequestModal] = useState<{
    isOpen: boolean;
    status: 'loading' | 'success' | 'error';
    title: string;
    message: string;
  }>({ isOpen: false, status: 'loading', title: '', message: '' });

  const step1Valid = draft.title.trim().length > 0 && draft.summary.trim().length > 0;
  const step2Valid = selectedStudents.length > 0;
  const step3Valid = milestones.every(isMilestoneComplete);
  const incompleteMilestoneCount = milestones.filter((m) => !isMilestoneComplete(m)).length;

  // ── Student search ──
  useEffect(() => {
    const normalizedQuery = studentQuery.trim();
    if (normalizedQuery.length < 3) {
      setSearchResults([]);
      setSearchState('idle');
      setSearchError(null);
      return;
    }

    let isCancelled = false;
    setSearchState('loading');
    setSearchError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await supervisorApi.searchStudents(normalizedQuery);
        if (isCancelled) return;
        const visible = results.filter((s) => !selectedStudents.some((sel) => sel.id === s.id));
        setSearchResults(visible);
        setSearchState(visible.length > 0 ? 'results' : 'empty');
      } catch (error) {
        if (isCancelled) return;
        setSearchResults([]);
        setSearchState('error');
        setSearchError(
          isApiException(error)
            ? error.apiError.message
            : 'Unable to search students right now. Please try again.',
        );
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [studentQuery, selectedStudents]);

  function updateDraft<F extends keyof DraftState>(field: F, value: DraftState[F]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function selectStudent(student: SupervisorStudentSearchResult) {
    setSelectedStudents((prev) => {
      if (prev.some((s) => s.id === student.id)) return prev;
      return [...prev, student];
    });
    setStudentQuery('');
    setSearchResults([]);
    setSearchState('idle');
    setSearchError(null);
  }

  function removeStudent(id: string) {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== id));
  }

  function updateMilestone<F extends keyof MilestoneDraft>(
    index: number,
    field: F,
    value: MilestoneDraft[F],
  ) {
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function addMilestone() {
    const newIndex = milestones.length;
    setMilestones((prev) => [...prev, { ...INITIAL_MILESTONE }]);
    setExpandedMilestoneIndex(newIndex);
    // FIX 3: scroll new milestone into view after render
    setTimeout(() => {
      milestoneRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  function removeMilestone(index: number) {
    if (milestones.length === 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== index));
    setExpandedMilestoneIndex((current) => {
      if (current === null) return null;
      if (current === index) {
        if (index === milestones.length - 1) return Math.max(0, index - 1);
        return index;
      }
      if (current > index) return current - 1;
      return current;
    });
  }

  // FIX 6: toggle expand/collapse on same index
  function toggleMilestone(index: number) {
    setExpandedMilestoneIndex((current) => (current === index ? null : index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // FIX 7: show hint instead of just being silently disabled
    if (!step3Valid) {
      setShowIncompleteHint(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setShowIncompleteHint(false);
    setCreatedProject(null);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Creating project',
      message: 'Saving the project, assigning students, and creating milestones.',
    });

    try {
      const response = await supervisorApi.createProject({
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        batch: draft.batch.trim(),
        semester: draft.semester.trim(),
        studentIds: selectedStudents.map((s) => s.id),
        milestones: milestones.map((milestone) => ({
          title: milestone.title.trim(),
          description: milestone.description.trim(),
          dueDate: milestone.dueDate,
        })),
      });

      setCreatedProject(response);
      invalidateSupervisorProjectsCache();
      setDraft(INITIAL_DRAFT);
      setSelectedStudents([]);
      setMilestones([{ ...INITIAL_MILESTONE }]);
      setExpandedMilestoneIndex(0);
      setStudentQuery('');
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: 'Project created',
        message: `${response.title} was created successfully and is ready for the next workflow steps.`,
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to create the project right now. Please try again.';
      setSubmitError(message);
      setRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Project creation failed',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeRequestModal() {
    const nextStatus = requestModal.status;
    setRequestModal((prev) => ({ ...prev, isOpen: false }));
    if (nextStatus === 'success') navigate('/supervisor/projects');
  }

  const shouldShowSearchPanel =
    studentQuery.trim().length >= 3 || searchState === 'loading' || searchState === 'error';
  const primaryCreatedMilestone = createdProject
    ? earliestMilestone(createdProject.milestones)
    : null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Project"
        subtitle="Fill in each step to set up a new project with students and milestones."
      />

      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        onClose={requestModal.status === 'loading' ? undefined : closeRequestModal}
        onRetry={requestModal.status === 'error' ? closeRequestModal : undefined}
      />

      <ProjectStepper
        currentStep={currentStep}
        steps={STEPS}
        onStepClick={(step) => {
          if (step < currentStep) setCurrentStep(step as StepId);
        }}
      />

      <form onSubmit={handleSubmit}>

        {/* ── Step 1: Project basics ── */}
        {currentStep === 1 && (
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
                onChange={(e) => updateDraft('title', e.target.value)}
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
                onChange={(e) => updateDraft('summary', e.target.value)}
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
                  onChange={(e) => updateDraft('batch', e.target.value)}
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
                  onChange={(e) => updateDraft('semester', e.target.value)}
                  maxLength={FIELD_LIMITS.semester}
                  className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!step1Valid}
                onClick={() => setCurrentStep(2)}
              >
                Next: Assign students →
              </Button>
            </div>
          </section>
        )}

        {/* ── Step 2: Student assignment ── */}
        {currentStep === 2 && (
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
                  onChange={(e) => setStudentQuery(e.target.value)}
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
                          onClick={() => selectStudent(student)}
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStudents.map((student) => (
                      <div
                        key={student.id}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-foreground">
                          {buildStudentLabel(student)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeStudent(student.id)}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={`Remove ${buildStudentLabel(student)}`}
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No students selected yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button type="button" variant="secondary" size="md" onClick={() => setCurrentStep(1)}>
                ← Back
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!step2Valid}
                onClick={() => setCurrentStep(3)}
              >
                Next: Add milestones →
              </Button>
            </div>
          </section>
        )}

        {/* ── Step 3: Milestones ── */}
        {currentStep === 3 && (
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
                    ref={(el) => { milestoneRefs.current[index] = el; }}
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
                      /* ── Expanded state ── */
                      <div className="p-5 sm:p-6">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                          <button
                            type="button"
                            onClick={() => toggleMilestone(index)}
                            className="flex items-center gap-2.5 text-left"
                            aria-label="Collapse milestone"
                          >
                            <span className="inline-flex h-8 items-center rounded-lg bg-slate-100 px-2.5 text-xs font-semibold tracking-[0.12em] text-slate-700">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              Milestone {index + 1}
                            </span>
                            {/* FIX 4: only show INCOMPLETE badge, remove redundant warning callout */}
                            {!isComplete && (
                              <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                                Incomplete
                              </span>
                            )}
                            {/* FIX 1: green complete badge */}
                            {isComplete && (
                              <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                  <path d="M1.5 5L3.5 7L8.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Complete
                              </span>
                            )}
                          </button>

                          <div className="flex items-center gap-2">
                            {milestones.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMilestone(index)}
                                className="inline-flex h-8 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                disabled={isSubmitting}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {/* FIX 4: no redundant warning callout — removed */}

                        <div className="space-y-4">
                          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                            <label className="block">
                              <span className="mb-2 block text-sm font-medium text-slate-800">Title</span>
                              <input
                                required
                                value={milestone.title}
                                onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                                maxLength={FIELD_LIMITS.milestoneTitle}
                                placeholder="e.g. Proposal Submission"
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-colors focus:border-slate-400"
                                disabled={isSubmitting}
                              />
                            </label>

                            <label className="block">
                              <span className="mb-2 block text-sm font-medium text-slate-800">
                                Due date
                              </span>
                              <input
                                required
                                type="date"
                                value={milestone.dueDate}
                                onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
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
                              onChange={(e) => updateMilestone(index, 'description', e.target.value)}
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
                      /* ── Collapsed state ── */
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <button
                          type="button"
                          onClick={() => toggleMilestone(index)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          disabled={isSubmitting}
                          aria-label={`Expand milestone ${index + 1}`}
                        >
                          {/* FIX 1: green check icon for complete, amber dot for incomplete */}
                          <div className={[
                            'flex h-9 shrink-0 items-center justify-center rounded-lg px-2.5 text-xs font-semibold tracking-[0.12em]',
                            isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700',
                          ].join(' ')}>
                            {isComplete ? (
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
                              {/* FIX 2: date shown softly, only if set */}
                              {date && (
                                <span className="text-xs text-slate-400">
                                  {date}
                                </span>
                              )}
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
                              onClick={() => removeMilestone(index)}
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

            {/* FIX 5: slightly more prominent add button */}
            <button
              type="button"
              onClick={addMilestone}
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

            <div className="flex flex-wrap items-end justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setCurrentStep(2)}
                disabled={isSubmitting}
              >
                ← Back
              </Button>
              <div className="flex flex-col items-end gap-2">
                {/* FIX 7: show incomplete hint instead of just a disabled button */}
                {showIncompleteHint && !step3Valid && (
                  <p className="text-xs text-amber-700">
                    Complete {incompleteMilestoneCount} milestone{incompleteMilestoneCount === 1 ? '' : 's'} before creating the project.
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
                    onClick={() => { if (!step3Valid) setShowIncompleteHint(true); }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create project'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </form>

      {/* Success panel */}
      {createdProject && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-900">Project created</h2>
          <p className="mt-2 text-sm leading-7 text-emerald-800">
            {createdProject.title} was created with {createdProject.students.length} assigned
            student{createdProject.students.length === 1 ? '' : 's'} and the first milestone
            scheduled for{' '}
            {dateFormatter.format(
              new Date(primaryCreatedMilestone?.dueDate ?? createdProject.milestoneDate),
            )}
            .
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Lifecycle</p>
              <p className="mt-2 font-semibold text-emerald-950">
                {createdProject.lifecycleStatus.replace('_', ' ')}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Milestone</p>
              <p className="mt-2 font-semibold text-emerald-950">
                {primaryCreatedMilestone?.title ?? 'No milestone returned'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}