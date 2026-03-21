import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, Clock3, Users } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { supervisorApi } from '../api/supervisorApi';
import { RepositorySection } from '../components/ProjectDetail/RepositorySection';
import { ProjectDetailsSkeleton } from '../components/ProjectDetailsSkeleton';
import { useSupervisorProject } from '../hooks/useSupervisorProject';
import type {
  SupervisorProjectDetail,
  SupervisorProjectDetailMember,
  SupervisorProjectDetailMilestone,
  SupervisorProjectDetailTab,
  SupervisorProjectLifecycle,
  SupervisorStudentSearchResult,
} from '../types';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const TABS: SupervisorProjectDetailTab[] = ['overview', 'team', 'milestones'];
const FIELD_LIMITS = {
  title: 40,
  summary: 250,
  batch: 32,
  semester: 32,
  healthNote: 250,
  milestoneTitle: 40,
  milestoneDescription: 250,
} as const;

const MILESTONE_STATUS_OPTIONS: SupervisorProjectDetailMilestone['status'][] = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'MISSED',
  'CANCELLED',
];

const LIFECYCLE_OPTIONS: SupervisorProjectLifecycle[] = [
  'PLANNING',
  'ACTIVE',
  'AT_RISK',
  'BEHIND',
  'COMPLETED',
];

type OverviewEditForm = {
  title: string;
  summary: string;
  batch: string;
  semester: string;
  lifecycleStatus: SupervisorProjectLifecycle;
  healthNote: string;
};

type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

type MilestoneForm = {
  title: string;
  description: string;
  dueDate: string;
  status: SupervisorProjectDetailMilestone['status'];
};

type RequestModalState = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
  retryAction: (() => Promise<void>) | null;
};

// ─── Status styling helpers ───────────────────────────────────────────────────

type MilestoneStatus = SupervisorProjectDetailMilestone['status'];

function milestoneStatusBg(status: MilestoneStatus) {
  switch (status) {
    case 'COMPLETED':  return 'bg-emerald-50 border-emerald-200';
    case 'IN_PROGRESS': return 'bg-sky-50 border-sky-200';
    case 'PLANNED':    return 'bg-white border-slate-200';
    case 'MISSED':     return 'bg-rose-50 border-rose-200';
    case 'CANCELLED':  return 'bg-slate-50 border-slate-200';
    default:           return 'bg-white border-slate-200';
  }
}

function milestoneStatusPill(status: MilestoneStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'IN_PROGRESS':
      return 'bg-sky-100 text-sky-800 border border-sky-200';
    case 'PLANNED':
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    case 'MISSED':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-400 border border-slate-200 line-through';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

function milestoneStatusLabel(status: MilestoneStatus) {
  return status.replace('_', ' ');
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

function memberDisplayName(member: SupervisorProjectDetailMember) {
  return `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.email;
}

function buildOverviewEditForm(project: SupervisorProjectDetail): OverviewEditForm {
  return {
    title: project.title,
    summary: project.summary ?? '',
    batch: project.batch ?? '',
    semester: project.semester ?? '',
    lifecycleStatus: project.lifecycleStatus,
    healthNote: project.healthNote ?? '',
  };
}

function toNullableTrimmed(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toApiError(error: unknown, fallbackMessage: string): ApiError {
  return isApiException(error)
    ? error.apiError
    : {
        code: 'INTERNAL_ERROR',
        message: fallbackMessage,
        details: [],
        timestamp: new Date().toISOString(),
        status: 0,
        error: 'Unexpected Error',
        path: '',
        traceId: null,
      };
}

function buildMilestoneForm(milestone: SupervisorProjectDetailMilestone): MilestoneForm {
  return {
    title: milestone.title,
    description: milestone.description ?? '',
    dueDate: milestone.dueDate,
    status: milestone.status,
  };
}

function toTabLabel(tab: string) {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project: loadedProject, isLoading, error, reload } = useSupervisorProject(projectId);
  const [project, setProject] = useState<SupervisorProjectDetail | null>(null);
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [isSavingOverview, setIsSavingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState<OverviewEditForm | null>(null);
  const [quickLifecycleStatus, setQuickLifecycleStatus] =
    useState<SupervisorProjectLifecycle>('PLANNING');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isManagingStudents, setIsManagingStudents] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentSearchState, setStudentSearchState] = useState<SearchState>('idle');
  const [studentSearchError, setStudentSearchError] = useState<ApiError | null>(null);
  const [studentSearchResults, setStudentSearchResults] = useState<SupervisorStudentSearchResult[]>([]);
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState<SupervisorStudentSearchResult[]>([]);
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [quickStatusUpdatingId, setQuickStatusUpdatingId] = useState<string | null>(null);
  const [newMilestoneForm, setNewMilestoneForm] = useState<MilestoneForm>({
    title: '',
    description: '',
    dueDate: '',
    status: 'PLANNED',
  });
  const [editMilestoneForm, setEditMilestoneForm] = useState<MilestoneForm | null>(null);
  const [initialEditMilestoneForm, setInitialEditMilestoneForm] = useState<MilestoneForm | null>(null);
  const [requestModal, setRequestModal] = useState<RequestModalState>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
    retryAction: null,
  });

  const requestedTab = searchParams.get('tab') as SupervisorProjectDetailTab | null;
  const activeTab = requestedTab && TABS.includes(requestedTab) ? requestedTab : 'overview';
  const initialOverviewForm = project ? buildOverviewEditForm(project) : null;
  const isOverviewDirty =
    overviewForm !== null &&
    initialOverviewForm !== null &&
    (overviewForm.title !== initialOverviewForm.title ||
      overviewForm.summary !== initialOverviewForm.summary ||
      overviewForm.batch !== initialOverviewForm.batch ||
      overviewForm.semester !== initialOverviewForm.semester ||
      overviewForm.lifecycleStatus !== initialOverviewForm.lifecycleStatus ||
      overviewForm.healthNote !== initialOverviewForm.healthNote);
  const isEditMilestoneDirty = useMemo(() => {
    if (!editMilestoneForm || !initialEditMilestoneForm) return false;
    return (
      editMilestoneForm.title !== initialEditMilestoneForm.title ||
      editMilestoneForm.description !== initialEditMilestoneForm.description ||
      editMilestoneForm.dueDate !== initialEditMilestoneForm.dueDate ||
      editMilestoneForm.status !== initialEditMilestoneForm.status
    );
  }, [editMilestoneForm, initialEditMilestoneForm]);

  useEffect(() => { setProject(loadedProject); }, [loadedProject]);

  useEffect(() => {
    if (project && !isEditingOverview) setOverviewForm(buildOverviewEditForm(project));
  }, [project, isEditingOverview]);

  useEffect(() => {
    if (project && !isUpdatingStatus) setQuickLifecycleStatus(project.lifecycleStatus);
  }, [project, isUpdatingStatus]);

  useEffect(() => {
    const normalizedQuery = studentQuery.trim();
    if (!project || !isManagingStudents || normalizedQuery.length < 3) {
      setStudentSearchResults([]);
      setStudentSearchState('idle');
      setStudentSearchError(null);
      return;
    }

    let isCancelled = false;
    setStudentSearchState('loading');
    setStudentSearchError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await supervisorApi.searchStudents(normalizedQuery);
        if (isCancelled) return;
        const excludedIds = new Set([
          ...project.members.filter((m) => m.memberRole === 'STUDENT').map((m) => m.id),
          ...selectedStudentsToAdd.map((s) => s.id),
        ]);
        const visibleResults = results.filter((s) => !excludedIds.has(s.id));
        setStudentSearchResults(visibleResults);
        setStudentSearchState(visibleResults.length > 0 ? 'results' : 'empty');
      } catch (searchException) {
        if (isCancelled) return;
        setStudentSearchResults([]);
        setStudentSearchState('error');
        setStudentSearchError(toApiError(searchException, 'Unable to search students right now.'));
      }
    }, 300);

    return () => { isCancelled = true; window.clearTimeout(timeoutId); };
  }, [isManagingStudents, project, selectedStudentsToAdd, studentQuery]);

  function handleTabChange(tab: SupervisorProjectDetailTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') { nextParams.delete('tab'); } else { nextParams.set('tab', tab); }
    setSearchParams(nextParams, { replace: true });
  }

  function handleProjectUpdate(updatedProject: SupervisorProjectDetail) { setProject(updatedProject); }
  function closeRequestModal() { setRequestModal((c) => ({ ...c, isOpen: false, retryAction: null })); }
  function showLoadingModal(title: string, message: string) { setRequestModal({ isOpen: true, status: 'loading', title, message, retryAction: null }); }
  function showSuccessModal(title: string, message: string) { setRequestModal({ isOpen: true, status: 'success', title, message, retryAction: null }); }
  function showErrorModal(title: string, message: string, retryAction: () => Promise<void>) { setRequestModal({ isOpen: true, status: 'error', title, message, retryAction }); }
  function retryLastRequest() { if (requestModal.retryAction) void requestModal.retryAction(); }

  function handleStartOverviewEdit() {
    if (!project) return;
    setOverviewForm(buildOverviewEditForm(project));
    setIsEditingOverview(true);
  }

  function handleCancelOverviewEdit() {
    if (project) setOverviewForm(buildOverviewEditForm(project));
    setIsEditingOverview(false);
  }

  async function submitOverviewUpdate() {
    if (!project || !overviewForm || !projectId) return;
    setIsSavingOverview(true);
    showLoadingModal('Saving project details', 'Updating the project summary and overview fields.');
    try {
      const updatedProject = await supervisorApi.updateProject(projectId, {
        title: overviewForm.title.trim(),
        summary: overviewForm.summary.trim(),
        batch: overviewForm.batch.trim(),
        semester: overviewForm.semester.trim(),
        lifecycleStatus: overviewForm.lifecycleStatus,
        healthNote: toNullableTrimmed(overviewForm.healthNote),
      });
      setProject(updatedProject);
      setIsEditingOverview(false);
      showSuccessModal('Project details updated', 'The project summary and overview details were updated successfully.');
    } catch (saveException) {
      const apiError = toApiError(saveException, 'Unable to update the project right now.');
      showErrorModal('Unable to save project details', apiError.message, submitOverviewUpdate);
    } finally {
      setIsSavingOverview(false);
    }
  }

  async function handleSaveOverview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitOverviewUpdate();
  }

  async function submitQuickStatusChange(nextStatus: SupervisorProjectLifecycle, previousStatus: SupervisorProjectLifecycle) {
    if (!projectId || !project) return;
    setQuickLifecycleStatus(nextStatus);
    setIsUpdatingStatus(true);
    showLoadingModal('Updating project status', `Switching lifecycle status to ${nextStatus}.`);
    try {
      const updatedProject = await supervisorApi.updateProjectStatus(projectId, { lifecycleStatus: nextStatus });
      setProject(updatedProject);
      showSuccessModal('Project status updated', `Lifecycle status is now ${nextStatus}.`);
    } catch (statusException) {
      setQuickLifecycleStatus(previousStatus);
      const apiError = toApiError(statusException, 'Unable to update project status right now.');
      showErrorModal('Unable to update project status', apiError.message, async () => submitQuickStatusChange(nextStatus, previousStatus));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handleQuickStatusChange(nextStatus: SupervisorProjectLifecycle) {
    if (!project) return;
    void submitQuickStatusChange(nextStatus, project.lifecycleStatus);
  }

  // ── Quick milestone status change (no full edit needed) ──
  async function submitQuickMilestoneStatus(
    milestone: SupervisorProjectDetailMilestone,
    nextStatus: MilestoneStatus,
  ) {
    if (!projectId) return;
    setQuickStatusUpdatingId(milestone.id);
    try {
      const updatedProject = await supervisorApi.updateProjectMilestone(projectId, milestone.id, {
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.dueDate,
        status: nextStatus,
      });
      setProject(updatedProject);
    } catch (e) {
      const apiError = toApiError(e, 'Unable to update milestone status right now.');
      showErrorModal('Status update failed', apiError.message, async () =>
        submitQuickMilestoneStatus(milestone, nextStatus),
      );
    } finally {
      setQuickStatusUpdatingId(null);
    }
  }

  function handleStartStudentManagement() { setIsManagingStudents(true); }
  function handleCancelStudentManagement() {
    setIsManagingStudents(false);
    setStudentQuery('');
    setStudentSearchResults([]);
    setStudentSearchState('idle');
    setStudentSearchError(null);
    setSelectedStudentsToAdd([]);
  }

  function handleSelectStudentToAdd(student: SupervisorStudentSearchResult) {
    setSelectedStudentsToAdd((c) => c.some((s) => s.id === student.id) ? c : [...c, student]);
    setStudentQuery('');
    setStudentSearchResults([]);
    setStudentSearchState('idle');
  }

  function handleRemoveSelectedStudent(studentId: string) {
    setSelectedStudentsToAdd((c) => c.filter((s) => s.id !== studentId));
  }

  async function submitAddStudents() {
    if (!projectId || selectedStudentsToAdd.length === 0) return;
    setIsAddingStudents(true);
    showLoadingModal('Adding team members', 'Assigning selected students to this project.');
    try {
      const updatedProject = await supervisorApi.addProjectMembers(projectId, {
        studentIds: selectedStudentsToAdd.map((s) => s.id),
      });
      setProject(updatedProject);
      handleCancelStudentManagement();
      showSuccessModal('Team updated', 'Selected students were added to the project.');
    } catch (addException) {
      const apiError = toApiError(addException, 'Unable to add students right now.');
      showErrorModal('Unable to add students', apiError.message, submitAddStudents);
    } finally {
      setIsAddingStudents(false);
    }
  }

  function handleAddStudents() { void submitAddStudents(); }
  function handleStartAddMilestone() { setEditingMilestoneId(null); setEditMilestoneForm(null); setIsAddingMilestone(true); }
  function handleCancelAddMilestone() { setIsAddingMilestone(false); setNewMilestoneForm({ title: '', description: '', dueDate: '', status: 'PLANNED' }); }

  async function submitMilestoneCreate() {
    if (!projectId) return;
    setIsSavingMilestone(true);
    showLoadingModal('Adding milestone', 'Creating a new milestone for this project.');
    try {
      const updatedProject = await supervisorApi.addProjectMilestone(projectId, {
        title: newMilestoneForm.title.trim(),
        description: toNullableTrimmed(newMilestoneForm.description),
        dueDate: newMilestoneForm.dueDate,
      });
      setProject(updatedProject);
      handleCancelAddMilestone();
      showSuccessModal('Milestone added', 'The milestone was added successfully.');
    } catch (milestoneException) {
      const apiError = toApiError(milestoneException, 'Unable to add milestone right now.');
      showErrorModal('Unable to add milestone', apiError.message, submitMilestoneCreate);
    } finally {
      setIsSavingMilestone(false);
    }
  }

  async function handleCreateMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMilestoneCreate();
  }

  function handleStartEditMilestone(milestone: SupervisorProjectDetailMilestone) {
    const nextForm = buildMilestoneForm(milestone);
    setIsAddingMilestone(false);
    setEditingMilestoneId(milestone.id);
    setEditMilestoneForm(nextForm);
    setInitialEditMilestoneForm(nextForm);
  }

  function handleCancelEditMilestone() {
    setEditingMilestoneId(null);
    setEditMilestoneForm(null);
    setInitialEditMilestoneForm(null);
  }

  async function submitMilestoneUpdate() {
    if (!projectId || !editingMilestoneId || !editMilestoneForm || !isEditMilestoneDirty) return;
    setIsSavingMilestone(true);
    showLoadingModal('Saving milestone', 'Updating milestone details and current status.');
    try {
      const updatedProject = await supervisorApi.updateProjectMilestone(projectId, editingMilestoneId, {
        title: editMilestoneForm.title.trim(),
        description: toNullableTrimmed(editMilestoneForm.description),
        dueDate: editMilestoneForm.dueDate,
        status: editMilestoneForm.status,
      });
      setProject(updatedProject);
      handleCancelEditMilestone();
      showSuccessModal('Milestone updated', 'Milestone changes were saved successfully.');
    } catch (milestoneException) {
      const apiError = toApiError(milestoneException, 'Unable to update milestone right now.');
      showErrorModal('Unable to update milestone', apiError.message, submitMilestoneUpdate);
    } finally {
      setIsSavingMilestone(false);
    }
  }

  async function handleSaveMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMilestoneUpdate();
  }

  if (isLoading) return <ProjectDetailsSkeleton />;

  if (error) {
    if (error.code === 'NOT_FOUND') {
      return (
        <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Project not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested supervisor project could not be found or is not available to your account.
          </p>
          <Link to="/supervisor/projects" className={buttonStyles({ variant: 'primary', size: 'md', className: 'mt-6' })}>
            Back to projects
          </Link>
        </div>
      );
    }
    return <ErrorState error={error} onRetry={() => void reload()} />;
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        onClose={requestModal.status === 'loading' ? undefined : closeRequestModal}
        onRetry={requestModal.status === 'error' ? retryLastRequest : undefined}
      />

      <PageHeader
        title={project.title}
        subtitle={project.summary ?? 'No summary has been recorded for this project yet.'}
      />

      <section className="flex flex-wrap gap-3">
        <label className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm shadow-sm">
          <select
            value={quickLifecycleStatus}
            onChange={(e) => void handleQuickStatusChange(e.target.value as SupervisorProjectLifecycle)}
            disabled={isUpdatingStatus}
            className="bg-transparent font-semibold tracking-[0.08em] text-foreground outline-none"
          >
            {LIFECYCLE_OPTIONS.map((status) => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <CalendarDays className="h-4 w-4" />
          {project.milestoneDate ? `Milestone ${dateFormatter.format(new Date(project.milestoneDate))}` : 'Milestone not set'}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <Users className="h-4 w-4" />
          {project.members.length} team member{project.members.length === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <Clock3 className="h-4 w-4" />
          Progress {project.progressPercent ?? 0}%
        </span>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Batch', value: project.batch ?? 'Not set' },
          { label: 'Semester', value: project.semester ?? 'Not set' },
          { label: 'Milestones', value: String(project.milestones.length) },
          {
            label: 'Last Activity',
            value: project.lastActivityAt ? dateTimeFormatter.format(new Date(project.lastActivityAt)) : 'Not recorded',
            small: true,
          },
        ].map(({ label, value, small }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className={`mt-2 font-semibold text-foreground ${small ? 'text-sm' : 'text-2xl'}`}>{value}</p>
          </div>
        ))}
      </section>

      <PageTabs
        items={TABS.map((tab) => ({ value: tab, label: toTabLabel(tab) }))}
        value={activeTab}
        onChange={(value) => handleTabChange(value as SupervisorProjectDetailTab)}
        tone="supervisor"
      />

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">Project summary</h2>
                {!isEditingOverview && (
                  <button type="button" className={buttonStyles({ variant: 'secondary', size: 'sm' })} onClick={handleStartOverviewEdit}>
                    Edit details
                  </button>
                )}
              </div>

              {isEditingOverview && overviewForm ? (
                <form className="mt-5 space-y-4" onSubmit={handleSaveOverview}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Title</span>
                      <input required maxLength={FIELD_LIMITS.title} value={overviewForm.title}
                        onChange={(e) => setOverviewForm((c) => c ? { ...c, title: e.target.value } : c)}
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lifecycle</span>
                      <select value={overviewForm.lifecycleStatus}
                        onChange={(e) => setOverviewForm((c) => c ? { ...c, lifecycleStatus: e.target.value as SupervisorProjectLifecycle } : c)}
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300">
                        {LIFECYCLE_OPTIONS.map((o) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Batch</span>
                      <input required maxLength={FIELD_LIMITS.batch} value={overviewForm.batch}
                        onChange={(e) => setOverviewForm((c) => c ? { ...c, batch: e.target.value } : c)}
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Semester</span>
                      <input required maxLength={FIELD_LIMITS.semester} value={overviewForm.semester}
                        onChange={(e) => setOverviewForm((c) => c ? { ...c, semester: e.target.value } : c)}
                        className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300" />
                    </label>
                    <label className="space-y-1.5 sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Summary</span>
                      <textarea required maxLength={FIELD_LIMITS.summary} rows={4} value={overviewForm.summary}
                        onChange={(e) => setOverviewForm((c) => c ? { ...c, summary: e.target.value } : c)}
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300" />
                    </label>
                    <label className="space-y-1.5 sm:col-span-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Health note</span>
                      <textarea maxLength={FIELD_LIMITS.healthNote} rows={3} value={overviewForm.healthNote}
                        onChange={(e) => setOverviewForm((c) => c ? { ...c, healthNote: e.target.value } : c)}
                        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300" />
                    </label>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button type="button" disabled={isSavingOverview} className={buttonStyles({ variant: 'secondary', size: 'md' })} onClick={handleCancelOverviewEdit}>Cancel</button>
                    <button type="submit" disabled={isSavingOverview || !isOverviewDirty} className={buttonStyles({ variant: 'primary', size: 'md' })}>
                      {isSavingOverview ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Batch</p><p className="mt-1 font-medium text-foreground">{project.batch ?? 'Not set'}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Semester</p><p className="mt-1 font-medium text-foreground">{project.semester ?? 'Not set'}</p></div>
                  <div className="sm:col-span-2"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Summary</p><p className="mt-1 text-sm leading-7 text-muted-foreground">{project.summary ?? 'No summary recorded yet.'}</p></div>
                  <div className="sm:col-span-2"><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Health note</p><p className="mt-1 text-sm leading-7 text-muted-foreground">{project.healthNote ?? 'No health note recorded yet.'}</p></div>
                </div>
              )}
            </div>

            <RepositorySection project={project} onUpdate={handleProjectUpdate} />

            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Current scope</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                This detail view currently shows only backend-backed project data: core project fields, assigned members, and milestone records. Workflow features such as meetings, files, action items, and integrations are not part of this endpoint yet.
              </p>
            </div>
          </section>

          <aside className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Primary milestone</h2>
            {project.milestones.length > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-foreground">{project.milestones[0].title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Due {dateFormatter.format(new Date(project.milestones[0].dueDate))}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{project.milestones[0].description ?? 'No description provided.'}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No milestones recorded yet.</p>
            )}
          </aside>
        </div>
      ) : null}

      {/* ── TEAM TAB ── */}
      {activeTab === 'team' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Team</h2>
            {!isManagingStudents && (
              <button type="button" className={buttonStyles({ variant: 'secondary', size: 'sm' })} onClick={handleStartStudentManagement}>
                Manage students
              </button>
            )}
          </div>

          {isManagingStudents && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Search student email</span>
                <input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Type at least 3 characters from a student email"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300"
                  disabled={isAddingStudents} />
              </label>

              {studentQuery.trim().length >= 3 && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                  {studentSearchState === 'loading' && <p className="text-sm text-muted-foreground">Searching students...</p>}
                  {studentSearchState === 'error' && <p className="text-sm text-rose-600">{studentSearchError?.message ?? 'Unable to search students right now.'}</p>}
                  {studentSearchState === 'empty' && <p className="text-sm text-muted-foreground">No available students found.</p>}
                  {studentSearchState === 'results' && (
                    <div className="space-y-2">
                      {studentSearchResults.map((student) => (
                        <button key={student.id} type="button"
                          className="flex w-full items-start justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50"
                          onClick={() => handleSelectStudentToAdd(student)}>
                          <span>
                            <span className="block text-sm font-medium text-foreground">{`${student.firstName} ${student.lastName}`.trim() || student.email}</span>
                            <span className="block text-xs text-muted-foreground">{student.email}{student.registrationNumber ? ` • ${student.registrationNumber}` : ''}</span>
                          </span>
                          <span className="text-xs text-slate-500">Add</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedStudentsToAdd.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Selected students</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudentsToAdd.map((student) => (
                      <div key={student.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
                        <span className="text-foreground">{`${student.firstName} ${student.lastName}`.trim() || student.email}</span>
                        <button type="button" className="text-xs text-slate-500 hover:text-slate-700" onClick={() => handleRemoveSelectedStudent(student.id)} disabled={isAddingStudents}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button type="button" className={buttonStyles({ variant: 'secondary', size: 'sm' })} onClick={handleCancelStudentManagement} disabled={isAddingStudents}>Cancel</button>
                <button type="button" className={buttonStyles({ variant: 'primary', size: 'sm' })} onClick={handleAddStudents} disabled={isAddingStudents || selectedStudentsToAdd.length === 0}>
                  {isAddingStudents ? 'Adding...' : 'Add selected students'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {project.members.map((member) => (
              <div key={member.id} className={`rounded-2xl border p-4 ${member.memberRole === 'SUPERVISOR' ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-slate-50'}`}>
                <p className="font-medium text-foreground">{memberDisplayName(member)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RoleBadge role={member.memberRole} />
                  {member.registrationNumber && <span className="text-xs text-muted-foreground">• {member.registrationNumber}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── MILESTONES TAB ── */}
      {activeTab === 'milestones' ? (
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Milestones</h2>
            {!isAddingMilestone && (
              <button type="button" className={buttonStyles({ variant: 'secondary', size: 'sm' })} onClick={handleStartAddMilestone}>
                Add milestone
              </button>
            )}
          </div>

          {/* Add milestone form */}
          {isAddingMilestone && (
            <form className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={handleCreateMilestone}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Title</span>
                  <input required maxLength={FIELD_LIMITS.milestoneTitle} value={newMilestoneForm.title}
                    onChange={(e) => setNewMilestoneForm((c) => ({ ...c, title: e.target.value }))}
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Due date</span>
                  <input required type="date" value={newMilestoneForm.dueDate}
                    onChange={(e) => setNewMilestoneForm((c) => ({ ...c, dueDate: e.target.value }))}
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300" />
                </label>
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Description</span>
                  <textarea maxLength={FIELD_LIMITS.milestoneDescription} rows={3} value={newMilestoneForm.description}
                    onChange={(e) => setNewMilestoneForm((c) => ({ ...c, description: e.target.value }))}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300" />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button type="button" className={buttonStyles({ variant: 'secondary', size: 'sm' })} onClick={handleCancelAddMilestone} disabled={isSavingMilestone}>Cancel</button>
                <button type="submit" className={buttonStyles({ variant: 'primary', size: 'sm' })} disabled={isSavingMilestone}>
                  {isSavingMilestone ? 'Saving...' : 'Add milestone'}
                </button>
              </div>
            </form>
          )}

          {/* Milestone list */}
          {project.milestones.length > 0 ? (
            <div className="mt-5 space-y-3">
              {project.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`rounded-2xl border p-4 transition-colors ${milestoneStatusBg(milestone.status)}`}
                >
                  {editingMilestoneId === milestone.id && editMilestoneForm ? (
                    /* ── Edit form ── */
                    <form className="space-y-3" onSubmit={handleSaveMilestone}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1">
                          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Title</span>
                          <input required maxLength={FIELD_LIMITS.milestoneTitle} value={editMilestoneForm.title}
                            onChange={(e) => setEditMilestoneForm((c) => c ? { ...c, title: e.target.value } : c)}
                            className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300" />
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Due date</span>
                          <input required type="date" value={editMilestoneForm.dueDate}
                            onChange={(e) => setEditMilestoneForm((c) => c ? { ...c, dueDate: e.target.value } : c)}
                            className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300" />
                        </label>
                        <label className="space-y-1 sm:col-span-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</span>
                          <select value={editMilestoneForm.status}
                            onChange={(e) => setEditMilestoneForm((c) => c ? { ...c, status: e.target.value as MilestoneStatus } : c)}
                            className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300">
                            {MILESTONE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1 sm:col-span-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Description</span>
                          <textarea maxLength={FIELD_LIMITS.milestoneDescription} rows={3} value={editMilestoneForm.description}
                            onChange={(e) => setEditMilestoneForm((c) => c ? { ...c, description: e.target.value } : c)}
                            className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-amber-300" />
                        </label>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <button type="button" className={buttonStyles({ variant: 'secondary', size: 'sm' })} onClick={handleCancelEditMilestone} disabled={isSavingMilestone}>Cancel</button>
                        <button type="submit" className={buttonStyles({ variant: 'primary', size: 'sm' })} disabled={isSavingMilestone || !isEditMilestoneDirty}>
                          {isSavingMilestone ? 'Saving...' : 'Save milestone'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ── Read view ── */
                    <>
                      {/* Row 1: title | due date | status | edit — all in one row with fixed column widths */}
                      <div className="flex items-center gap-3">
                        {/* Title — takes remaining space */}
                        <p className="min-w-0 flex-1 truncate font-semibold text-foreground">
                          {milestone.sequenceNo}. {milestone.title}
                        </p>

                        {/* Due date — fixed width, right-aligned text */}
                        <p className="w-36 shrink-0 text-right text-sm text-muted-foreground">
                          Due {dateFormatter.format(new Date(milestone.dueDate))}
                        </p>

                        {/* Status pill — fixed width quick-change select */}
                        <label className={`inline-flex w-36 shrink-0 cursor-pointer items-center justify-between rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-opacity ${milestoneStatusPill(milestone.status)} ${quickStatusUpdatingId === milestone.id ? 'opacity-50' : ''}`}>
                          <select
                            value={milestone.status}
                            disabled={quickStatusUpdatingId === milestone.id}
                            onChange={(e) => void submitQuickMilestoneStatus(milestone, e.target.value as MilestoneStatus)}
                            className="w-full cursor-pointer appearance-none bg-transparent outline-none"
                            aria-label="Change milestone status"
                          >
                            {MILESTONE_STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{milestoneStatusLabel(s)}</option>
                            ))}
                          </select>
                          <svg className="ml-1 h-3 w-3 shrink-0 opacity-60" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </label>

                        {/* Edit button — fixed width */}
                        <button
                          type="button"
                          onClick={() => handleStartEditMilestone(milestone)}
                          className="inline-flex h-8 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Row 2: description */}
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
      ) : null}
    </div>
  );
}