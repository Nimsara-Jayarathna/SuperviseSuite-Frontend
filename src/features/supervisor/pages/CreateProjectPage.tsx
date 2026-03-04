import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BlockingState } from '@/components/ui/BlockingState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import type {
  CreateSupervisorProjectResponse,
  SupervisorStudentSearchResult,
} from '../types';

type DraftState = {
  title: string;
  batch: string;
  semester: string;
  summary: string;
  milestoneTitle: string;
  milestoneDescription: string;
  milestoneDueDate: string;
};

type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

const INITIAL_DRAFT: DraftState = {
  title: '',
  batch: '2026',
  semester: 'Semester 1',
  summary: '',
  milestoneTitle: '',
  milestoneDescription: '',
  milestoneDueDate: '',
};

function buildStudentLabel(student: SupervisorStudentSearchResult) {
  return `${student.firstName} ${student.lastName}`.trim() || student.email;
}

export function CreateProjectPage() {
  const [draft, setDraft] = useState<DraftState>(INITIAL_DRAFT);
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<SupervisorStudentSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<SupervisorStudentSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<CreateSupervisorProjectResponse | null>(null);
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

  function updateDraft<Field extends keyof DraftState>(field: Field, value: DraftState[Field]) {
    setDraft((current) => ({ ...current, [field]: value }));
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
  }

  function removeStudent(studentId: string) {
    setSelectedStudents((current) => current.filter((student) => student.id !== studentId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedStudents.length === 0) {
      setSubmitError('Select at least one registered student before creating the project.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setCreatedProject(null);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Creating project',
      message: 'Saving the project, assigning students, and creating the first milestone.',
    });

    try {
      const response = await supervisorApi.createProject({
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        batch: draft.batch.trim(),
        semester: draft.semester.trim(),
        studentIds: selectedStudents.map((student) => student.id),
        milestone: {
          title: draft.milestoneTitle.trim(),
          description: draft.milestoneDescription.trim(),
          dueDate: draft.milestoneDueDate,
        },
      });

      setCreatedProject(response);
      setDraft(INITIAL_DRAFT);
      setSelectedStudents([]);
      setStudentQuery('');
      setSearchResults([]);
      setSearchState('idle');
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
    setRequestModal((current) => ({ ...current, isOpen: false }));
  }

  function retrySubmit() {
    closeRequestModal();
  }

  const shouldShowSearchPanel =
    studentQuery.trim().length >= 3 || searchState === 'loading' || searchState === 'error';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Project"
        subtitle="Create a supervisor project, assign registered students, and capture the first milestone in one request."
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
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Project basics</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Capture the core project details the backend supports in this sprint.
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
                  placeholder="e.g. Smart Attendance Tracker"
                  className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  disabled={isSubmitting}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Summary</span>
                <textarea
                  required
                  value={draft.summary}
                  onChange={(event) => updateDraft('summary', event.target.value)}
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
                    onChange={(event) => updateDraft('batch', event.target.value)}
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
                    className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Student assignment</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Search registered students by email. Only selected students from the lookup can
                  be assigned in this sprint.
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
                            <p className="font-medium text-foreground">{buildStudentLabel(student)}</p>
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
                    <p className="mt-3 text-sm text-muted-foreground">
                      No students selected yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Initial milestone</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                This release stores one initial milestone. Future sprints can expand this into a
                full milestone timeline.
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Milestone title
                </span>
                <input
                  required
                  value={draft.milestoneTitle}
                  onChange={(event) => updateDraft('milestoneTitle', event.target.value)}
                  placeholder="e.g. Proposal Submission"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  disabled={isSubmitting}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Milestone description
                </span>
                <textarea
                  value={draft.milestoneDescription}
                  onChange={(event) => updateDraft('milestoneDescription', event.target.value)}
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
                  value={draft.milestoneDueDate}
                  onChange={(event) => updateDraft('milestoneDueDate', event.target.value)}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  disabled={isSubmitting}
                />
              </label>
            </div>
          </div>

          {submitError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3">
            <Link
              to="/supervisor/projects"
              className={buttonStyles({ variant: 'secondary', size: 'md' })}
            >
              Back to projects
            </Link>

            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              Create project
            </Button>
          </div>
        </form>
      </section>

      {createdProject ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-900">Project created</h2>
          <p className="mt-2 text-sm leading-7 text-emerald-800">
            {createdProject.title} was created in the backend with {createdProject.students.length}{' '}
            assigned student{createdProject.students.length === 1 ? '' : 's'} and the first
            milestone scheduled for {createdProject.milestone.dueDate}.
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
              <p className="mt-2 font-semibold text-emerald-950">{createdProject.milestone.title}</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
