import { startTransition, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { useSupervisorWorkspace } from '@/features/supervisor/hooks/useSupervisorWorkspace';

type Step = 1 | 2 | 3;

type DraftState = {
  title: string;
  batch: string;
  semester: string;
  milestoneDate: string;
  memberIds: string[];
  communicationUrl: string;
  repositoryUrl: string;
  jiraProjectKey: string;
  jiraBoardUrl: string;
};

export function CreateProjectPage() {
  const { projects } = useSupervisorWorkspace();
  const availableStudents = Array.from(
    new Map(
      projects
        .flatMap((project) => project.members)
        .filter((member) => member.role === 'Student')
        .map((member) => [member.id, member]),
    ).values(),
  );

  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [draft, setDraft] = useState<DraftState>({
    title: '',
    batch: '2026',
    semester: 'Semester 1',
    milestoneDate: '',
    memberIds: [],
    communicationUrl: '',
    repositoryUrl: '',
    jiraProjectKey: '',
    jiraBoardUrl: '',
  });

  function nextStep() {
    startTransition(() => setStep((current) => Math.min(3, current + 1) as Step));
  }

  function previousStep() {
    startTransition(() => setStep((current) => Math.max(1, current - 1) as Step));
  }

  function toggleMember(memberId: string) {
    setDraft((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId)
        ? current.memberIds.filter((id) => id !== memberId)
        : [...current.memberIds, memberId],
    }));
  }

  function canContinueFromStep1() {
    return Boolean(draft.title.trim() && draft.milestoneDate && draft.memberIds.length > 0);
  }

  function canContinueFromStep2() {
    return Boolean(draft.communicationUrl.trim());
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Project"
        subtitle="Start a new supervision workspace. This draft flow is UI-only until the backend project API is connected."
      />

      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <PageTabs
          items={[
            { value: '1', label: 'Step 1: Basics' },
            { value: '2', label: 'Step 2: Connections' },
            { value: '3', label: 'Step 3: Review' },
          ]}
          value={String(step)}
          onChange={() => {}}
          tone="supervisor"
          className="border-0 p-0 shadow-none"
        />

        {step === 1 ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Project title
                </span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="e.g. Smart Attendance Tracker"
                  className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Batch</span>
                  <input
                    value={draft.batch}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, batch: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Semester</span>
                  <input
                    value={draft.semester}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, semester: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Next milestone date
                </span>
                <input
                  type="date"
                  value={draft.milestoneDate}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, milestoneDate: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Team assignment</h2>
                <span className="text-sm text-muted-foreground">
                  {draft.memberIds.length} selected
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {availableStudents.map((student) => {
                  const selected = draft.memberIds.includes(student.id);

                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleMember(student.id)}
                      className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Student contributor</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Communication URL
              </span>
              <input
                value={draft.communicationUrl}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, communicationUrl: event.target.value }))
                }
                placeholder="https://teams.microsoft.com/..."
                className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Repository URL</span>
              <input
                value={draft.repositoryUrl}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, repositoryUrl: event.target.value }))
                }
                placeholder="https://github.com/org/repo"
                className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Jira project key
                </span>
                <input
                  value={draft.jiraProjectKey}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, jiraProjectKey: event.target.value }))
                  }
                  placeholder="ABC"
                  className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Jira board URL
                </span>
                <input
                  value={draft.jiraBoardUrl}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, jiraBoardUrl: event.target.value }))
                  }
                  placeholder="https://jira.example.com/boards/123"
                  className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                />
              </label>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-foreground">Draft summary</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Title</p>
                  <p className="mt-1 font-medium text-foreground">
                    {draft.title || 'Untitled project'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Milestone
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {draft.milestoneDate || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Batch</p>
                  <p className="mt-1 font-medium text-foreground">{draft.batch}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Semester
                  </p>
                  <p className="mt-1 font-medium text-foreground">{draft.semester}</p>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Assigned students
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableStudents
                    .filter((student) => draft.memberIds.includes(student.id))
                    .map((student) => (
                      <span
                        key={student.id}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-foreground"
                      >
                        {student.name}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-slate-100">
              <h2 className="text-lg font-semibold">Implementation note</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                This page currently validates and previews the project draft in the UI only. Actual
                project creation should be connected to the backend project API in the next step.
              </p>
              {submitted ? (
                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
                  Draft accepted in the UI flow. Connect this step to the backend to persist the
                  project.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <Link
            to="/supervisor/projects"
            className="inline-flex items-center justify-center rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-slate-50"
          >
            Cancel
          </Link>

          <div className="flex flex-wrap gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={previousStep}
                className="rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-slate-50"
              >
                Back
              </button>
            ) : null}

            {step === 1 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canContinueFromStep1()}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            ) : null}

            {step === 2 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canContinueFromStep2()}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Review draft
              </button>
            ) : null}

            {step === 3 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
              >
                Finalize UI draft
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
