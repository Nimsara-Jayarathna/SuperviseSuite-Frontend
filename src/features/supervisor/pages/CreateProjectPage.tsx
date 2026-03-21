import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BlockingState } from '@/components/ui/BlockingState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { cn } from '@/lib/cn';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import { invalidateSupervisorProjectsCache } from '../hooks/useSupervisorProjects';
import type { SupervisorStudentSearchResult } from '../types';

type MilestoneDraft = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
};

type DraftState = {
  title: string;
  batch: string;
  semester: string;
  summary: string;
  milestones: MilestoneDraft[];
};

type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';
type CreateProjectStep = 'basics' | 'students' | 'milestones';

const CREATE_PROJECT_STEPS: Array<{
  id: CreateProjectStep;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: 'basics',
    label: 'Step 1',
    title: 'Project basics',
    description: 'Capture the core project information first.',
  },
  {
    id: 'students',
    label: 'Step 2',
    title: 'Student assignment',
    description: 'Choose the registered students assigned to this project.',
  },
  {
    id: 'milestones',
    label: 'Step 3',
    title: 'Milestones',
    description: 'Add every milestone now, then create the project in one final request.',
  },
];

let milestoneDraftCounter = 0;

function createMilestoneDraft(): MilestoneDraft {
  milestoneDraftCounter += 1;
  return {
    id: `milestone-${milestoneDraftCounter}`,
    title: '',
    description: '',
    dueDate: '',
  };
}

const INITIAL_DRAFT: DraftState = {
  title: '',
  batch: '2026',
  semester: 'Semester 1',
  summary: '',
  milestones: [createMilestoneDraft()],
};

const FIELD_LIMITS = {
  title: 40,
  batch: 32,
  semester: 32,
  summary: 250,
  milestoneTitle: 40,
  milestoneDescription: 250,
} as const;

function buildStudentLabel(student: SupervisorStudentSearchResult) {
  return `${student.firstName} ${student.lastName}`.trim() || student.email;
}

export function CreateProjectPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CreateProjectStep>('basics');
  const [draft, setDraft] = useState<DraftState>(INITIAL_DRAFT);
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<SupervisorStudentSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<SupervisorStudentSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [requestModal, setRequestModal] = useState<{
    isOpen: boolean;
    status: 'loading' | 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });

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
        if (isCancelled) {
          return;
        }

        const visibleResults = results.filter(
          (student) => !selectedStudents.some((selected) => selected.id === student.id),
        );

        setSearchResults(visibleResults);
        setSearchState(visibleResults.length > 0 ? 'results' : 'empty');
      } catch (error) {
        if (isCancelled) {
          return;
        }

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

  function updateDraft<Field extends Exclude<keyof DraftState, 'milestones'>>(
    field: Field,
    value: DraftState[Field],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateMilestone(
    milestoneId: string,
    field: Exclude<keyof MilestoneDraft, 'id'>,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      milestones: current.milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, [field]: value } : milestone,
      ),
    }));
  }

  function addMilestone() {
    setDraft((current) => ({
      ...current,
      milestones: [...current.milestones, createMilestoneDraft()],
    }));
  }

  function removeMilestone(milestoneId: string) {
    setDraft((current) => {
      if (current.milestones.length === 1) {
        return current;
      }

      return {
        ...current,
        milestones: current.milestones.filter((milestone) => milestone.id !== milestoneId),
      };
    });
  }

  function selectStudent(student: SupervisorStudentSearchResult) {
    setSelectedStudents((current) => {
      if (current.some((item) => item.id === student.id)) {
        return current;
      }
      return [...current, student];
    });
    setStudentQuery('');
    setSearchResults([]);
    setSearchState('idle');
    setSearchError(null);
    setSubmitError(null);
  }

  function removeStudent(studentId: string) {
    setSelectedStudents((current) => current.filter((student) => student.id !== studentId));
  }

  function validateBasicsStep() {
    if (!draft.title.trim()) {
      setSubmitError('Enter a project title before moving to the next step.');
      return false;
    }
    if (!draft.summary.trim()) {
      setSubmitError('Enter a project summary before moving to the next step.');
      return false;
    }
    if (!draft.batch.trim()) {
      setSubmitError('Enter the batch before moving to the next step.');
      return false;
    }
    if (!draft.semester.trim()) {
      setSubmitError('Enter the semester before moving to the next step.');
      return false;
    }

    setSubmitError(null);
    return true;
  }

  function validateStudentsStep() {
    if (selectedStudents.length === 0) {
      setSubmitError('Select at least one registered student before moving to milestones.');
      return false;
    }

    setSubmitError(null);
    return true;
  }

  function validateMilestonesStep() {
    if (draft.milestones.length === 0) {
      setSubmitError('Add at least one milestone before creating the project.');
      return false;
    }

    const invalidMilestoneIndex = draft.milestones.findIndex(
      (milestone) => !milestone.title.trim() || !milestone.dueDate,
    );
    if (invalidMilestoneIndex >= 0) {
      setSubmitError(
        `Complete milestone ${invalidMilestoneIndex + 1} with a title and due date before creating the project.`,
      );
      return false;
    }

    setSubmitError(null);
    return true;
  }

  function goToNextStep() {
    const currentStepIndex = CREATE_PROJECT_STEPS.findIndex((step) => step.id === currentStep);

    if (currentStep === 'basics' && !validateBasicsStep()) {
      return;
    }

    if (currentStep === 'students' && !validateStudentsStep()) {
      return;
    }

    setSubmitError(null);
    setCurrentStep(CREATE_PROJECT_STEPS[currentStepIndex + 1]?.id ?? currentStep);
  }

  function goToPreviousStep() {
    const currentStepIndex = CREATE_PROJECT_STEPS.findIndex((step) => step.id === currentStep);
    setSubmitError(null);
    setCurrentStep(CREATE_PROJECT_STEPS[currentStepIndex - 1]?.id ?? currentStep);
  }

  async function submitProjectCreation() {
    if (isSubmitting) {
      return;
    }

    if (!validateBasicsStep() || !validateStudentsStep() || !validateMilestonesStep()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setCreatedProjectId(null);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Creating project',
      message: 'Saving the project, assigning students, and creating all milestones.',
    });

    try {
      const response = await supervisorApi.createProject({
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        batch: draft.batch.trim(),
        semester: draft.semester.trim(),
        studentIds: selectedStudents.map((student) => student.id),
        milestones: draft.milestones.map((milestone) => ({
          title: milestone.title.trim(),
          description: milestone.description.trim(),
          dueDate: milestone.dueDate,
        })),
      });

      setCreatedProjectId(response.id);
      invalidateSupervisorProjectsCache();
      setDraft({
        ...INITIAL_DRAFT,
        milestones: [createMilestoneDraft()],
      });
      setSelectedStudents([]);
      setStudentQuery('');
      setSearchResults([]);
      setSearchState('idle');
      setCurrentStep('basics');
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentStep !== 'milestones') {
      goToNextStep();
      return;
    }

    await submitProjectCreation();
  }

  function closeRequestModal() {
    const nextStatus = requestModal.status;
    setRequestModal((current) => ({ ...current, isOpen: false }));

    if (nextStatus === 'success' && createdProjectId) {
      navigate(`/supervisor/projects/${createdProjectId}`);
    }
  }

  async function retrySubmit() {
    await submitProjectCreation();
  }

  function renderLimit(currentLength: number, maxLength: number) {
    return (
      <span className="text-xs text-muted-foreground">
        {currentLength}/{maxLength} characters
      </span>
    );
  }

  const shouldShowSearchPanel =
    studentQuery.trim().length >= 3 || searchState === 'loading' || searchState === 'error';
  const currentStepIndex = CREATE_PROJECT_STEPS.findIndex((step) => step.id === currentStep);
  const isFinalStep = currentStep === 'milestones';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Project"
        subtitle="Move through project basics, student assignment, and milestones, then send everything in one final create request."
      />

      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        onClose={requestModal.status === 'loading' ? undefined : closeRequestModal}
        onRetry={requestModal.status === 'error' ? retrySubmit : undefined}
      />

      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          {CREATE_PROJECT_STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isComplete = index < currentStepIndex;

            return (
              <div
                key={step.id}
                className={cn(
                  'rounded-2xl border px-4 py-4 transition-colors',
                  isActive
                    ? 'border-amber-300 bg-amber-50'
                    : isComplete
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50',
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {step.label}
                </p>
                <h2 className="mt-2 text-base font-semibold text-foreground">{step.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          {currentStep === 'basics' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Project basics</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Enter the project details first. You will add the student team and milestones in
                  the next steps.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Project title
                </span>
                <input
                  required
                  value={draft.title}
                  onChange={(event) => updateDraft('title', event.target.value)}
                  maxLength={FIELD_LIMITS.title}
                  placeholder="e.g. Smart Attendance Tracker"
                  className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  disabled={isSubmitting}
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                  <span>Summary</span>
                  {renderLimit(draft.summary.length, FIELD_LIMITS.summary)}
                </span>
                <textarea
                  required
                  value={draft.summary}
                  onChange={(event) => updateDraft('summary', event.target.value)}
                  maxLength={FIELD_LIMITS.summary}
                  placeholder="Describe the project scope, purpose, and expected outcome."
                  rows={5}
                  className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  disabled={isSubmitting}
                />
                <span className="mt-2 block text-xs text-muted-foreground">
                  Limit the summary to the key project scope and intended outcome.
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Batch</span>
                  <input
                    required
                    value={draft.batch}
                    onChange={(event) => updateDraft('batch', event.target.value)}
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
                    onChange={(event) => updateDraft('semester', event.target.value)}
                    maxLength={FIELD_LIMITS.semester}
                    className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {currentStep === 'students' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Student assignment</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Search registered students by email and build the project team before moving to
                  milestones.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">
                    Search student email
                  </span>
                  <input
                    value={studentQuery}
                    onChange={(event) => setStudentQuery(event.target.value)}
                    placeholder="Type at least 3 characters from the student email"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                    disabled={isSubmitting}
                  />
                </label>

                {shouldShowSearchPanel ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                    <BlockingState
                      isActive={searchState === 'loading'}
                      mode="inline"
                      message="Searching registered students..."
                      className="border-0 px-0 py-2"
                    />

                    {searchState === 'results' ? (
                      <div className="space-y-2">
                        {searchResults.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => selectStudent(student)}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                            disabled={isSubmitting}
                          >
                            <p className="font-medium text-foreground">
                              {buildStudentLabel(student)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{student.email}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              {student.registrationNumber}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {searchState === 'empty' ? (
                      <p className="px-1 py-2 text-sm text-muted-foreground">
                        No registered student found.
                      </p>
                    ) : null}

                    {searchState === 'error' ? (
                      <p className="px-1 py-2 text-sm text-rose-600">
                        {searchError ?? 'Unable to search students right now.'}
                      </p>
                    ) : null}
                  </div>
                ) : null}

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
            </div>
          ) : null}

          {currentStep === 'milestones' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Project milestones</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Add every milestone now. The full project, team assignment, and milestone list
                    will be submitted together from this final step.
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-foreground">
                  {draft.milestones.length} milestone{draft.milestones.length === 1 ? '' : 's'} added
                </div>
              </div>

              <div className="space-y-4">
                {draft.milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Milestone {index + 1}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-foreground">
                          Define a review checkpoint
                        </h3>
                      </div>
                      {draft.milestones.length > 1 ? (
                        <button
                          type="button"
                          className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                          onClick={() => removeMilestone(milestone.id)}
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-foreground">
                          Milestone title
                        </span>
                        <input
                          required
                          value={milestone.title}
                          onChange={(event) =>
                            updateMilestone(milestone.id, 'title', event.target.value)
                          }
                          maxLength={FIELD_LIMITS.milestoneTitle}
                          placeholder="e.g. Proposal Submission"
                          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                          disabled={isSubmitting}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                          <span>Milestone description</span>
                          {renderLimit(
                            milestone.description.length,
                            FIELD_LIMITS.milestoneDescription,
                          )}
                        </span>
                        <textarea
                          value={milestone.description}
                          onChange={(event) =>
                            updateMilestone(milestone.id, 'description', event.target.value)
                          }
                          maxLength={FIELD_LIMITS.milestoneDescription}
                          placeholder="Add any context or review expectations for this milestone."
                          rows={4}
                          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                          disabled={isSubmitting}
                        />
                      </label>

                      <label className="block sm:max-w-xs">
                        <span className="mb-2 block text-sm font-medium text-foreground">
                          Due date
                        </span>
                        <input
                          required
                          type="date"
                          value={milestone.dueDate}
                          onChange={(event) =>
                            updateMilestone(milestone.id, 'dueDate', event.target.value)
                          }
                          className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'md' })}
                onClick={addMilestone}
                disabled={isSubmitting}
              >
                Add another milestone
              </button>
            </div>
          ) : null}

          {submitError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              {currentStep === 'basics' ? (
                <Link
                  to="/supervisor/projects"
                  className={buttonStyles({ variant: 'secondary', size: 'md' })}
                >
                  Back to projects
                </Link>
              ) : (
                <Button type="button" variant="secondary" size="md" onClick={goToPreviousStep}>
                  Back
                </Button>
              )}
            </div>

            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isFinalStep ? 'Create project' : 'Next'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
