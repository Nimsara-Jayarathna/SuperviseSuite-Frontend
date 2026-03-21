import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { ApiError } from '@/types';
import { supervisorApi } from '../api/supervisorApi';
import {
  buildMilestoneForm,
  buildOverviewEditForm,
  toApiError,
  toNullableTrimmed,
} from '../projectDetails.shared';
import type {
  MilestoneForm,
  MilestoneStatus,
  OverviewEditForm,
  RequestModalState,
  SearchState,
} from '../projectDetails.shared';
import type {
  SupervisorProjectDetail,
  SupervisorProjectDetailMilestone,
  SupervisorProjectLifecycle,
  SupervisorStudentSearchResult,
} from '../types';

type UseProjectDetailsPageStateParams = {
  projectId: string | undefined;
  loadedProject: SupervisorProjectDetail | null;
};

export type OverviewState = {
  isEditingOverview: boolean;
  isSavingOverview: boolean;
  overviewForm: OverviewEditForm | null;
  isOverviewDirty: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setField: (field: keyof OverviewEditForm, value: string) => void;
};

export type TeamState = {
  isManagingStudents: boolean;
  studentQuery: string;
  studentSearchState: SearchState;
  studentSearchError: ApiError | null;
  studentSearchResults: SupervisorStudentSearchResult[];
  selectedStudentsToAdd: SupervisorStudentSearchResult[];
  isAddingStudents: boolean;
  leaderDraftId: string;
  isUpdatingLeader: boolean;
  studentMembers: SupervisorProjectDetail['members'];
  setStudentQuery: (query: string) => void;
  setLeaderDraftId: (id: string) => void;
  startManagement: () => void;
  cancelManagement: () => void;
  selectStudentToAdd: (student: SupervisorStudentSearchResult) => void;
  removeSelectedStudent: (studentId: string) => void;
  addStudents: () => void;
  submitLeaderUpdate: () => Promise<void>;
};

export type MilestonesState = {
  isAddingMilestone: boolean;
  isSavingMilestone: boolean;
  editingMilestoneId: string | null;
  quickStatusUpdatingId: string | null;
  newMilestoneForm: MilestoneForm;
  editMilestoneForm: MilestoneForm | null;
  isEditMilestoneDirty: boolean;
  startAddMilestone: () => void;
  cancelAddMilestone: () => void;
  createMilestone: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  startEditMilestone: (milestone: SupervisorProjectDetailMilestone) => void;
  cancelEditMilestone: () => void;
  saveMilestone: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setNewMilestoneField: (field: keyof MilestoneForm, value: string) => void;
  setEditMilestoneField: (field: keyof MilestoneForm, value: string) => void;
  submitQuickMilestoneStatus: (
    milestone: SupervisorProjectDetailMilestone,
    nextStatus: MilestoneStatus,
  ) => Promise<void>;
};

export type RequestModalControls = {
  state: RequestModalState;
  close: () => void;
  retryLastRequest: () => void;
};

export type ProjectDetailsActions = {
  quickLifecycleStatus: SupervisorProjectLifecycle;
  isUpdatingStatus: boolean;
  handleQuickStatusChange: (nextStatus: SupervisorProjectLifecycle) => void;
  handleProjectUpdate: (updatedProject: SupervisorProjectDetail) => void;
};

export function useProjectDetailsPageState({
  projectId,
  loadedProject,
}: UseProjectDetailsPageStateParams) {
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
  const [studentSearchResults, setStudentSearchResults] = useState<SupervisorStudentSearchResult[]>(
    [],
  );
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState<
    SupervisorStudentSearchResult[]
  >([]);
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [leaderDraftId, setLeaderDraftId] = useState<string>('');
  const [isUpdatingLeader, setIsUpdatingLeader] = useState(false);
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
  const [initialEditMilestoneForm, setInitialEditMilestoneForm] = useState<MilestoneForm | null>(
    null,
  );
  const [requestModal, setRequestModal] = useState<RequestModalState>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
    retryAction: null,
  });

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

  const studentMembers = useMemo(
    () => project?.members.filter((member) => member.memberRole === 'STUDENT') ?? [],
    [project],
  );

  useEffect(() => {
    setProject(loadedProject);
  }, [loadedProject]);

  useEffect(() => {
    if (project && !isEditingOverview) setOverviewForm(buildOverviewEditForm(project));
  }, [project, isEditingOverview]);

  useEffect(() => {
    if (project && !isUpdatingStatus) setQuickLifecycleStatus(project.lifecycleStatus);
  }, [project, isUpdatingStatus]);

  useEffect(() => {
    setLeaderDraftId(project?.leader?.id ?? '');
  }, [project?.leader?.id]);

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

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isManagingStudents, project, selectedStudentsToAdd, studentQuery]);

  function handleProjectUpdate(updatedProject: SupervisorProjectDetail) {
    setProject(updatedProject);
  }

  function closeRequestModal() {
    setRequestModal((current) => ({ ...current, isOpen: false, retryAction: null }));
  }

  function showLoadingModal(title: string, message: string) {
    setRequestModal({ isOpen: true, status: 'loading', title, message, retryAction: null });
  }

  function showSuccessModal(title: string, message: string) {
    setRequestModal({ isOpen: true, status: 'success', title, message, retryAction: null });
  }

  function showErrorModal(title: string, message: string, retryAction: () => Promise<void>) {
    setRequestModal({ isOpen: true, status: 'error', title, message, retryAction });
  }

  function retryLastRequest() {
    if (requestModal.retryAction) void requestModal.retryAction();
  }

  function startOverviewEdit() {
    if (!project) return;
    setOverviewForm(buildOverviewEditForm(project));
    setIsEditingOverview(true);
  }

  function cancelOverviewEdit() {
    if (project) setOverviewForm(buildOverviewEditForm(project));
    setIsEditingOverview(false);
  }

  function setOverviewField(field: keyof OverviewEditForm, value: string) {
    setOverviewForm((current) => (current ? { ...current, [field]: value } : current));
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
        leaderStudentId: project.leader?.id ?? null,
      });
      setProject(updatedProject);
      setIsEditingOverview(false);
      showSuccessModal(
        'Project details updated',
        'The project summary and overview details were updated successfully.',
      );
    } catch (saveException) {
      const apiError = toApiError(saveException, 'Unable to update the project right now.');
      showErrorModal('Unable to save project details', apiError.message, submitOverviewUpdate);
    } finally {
      setIsSavingOverview(false);
    }
  }

  async function saveOverview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitOverviewUpdate();
  }

  async function submitQuickStatusChange(
    nextStatus: SupervisorProjectLifecycle,
    previousStatus: SupervisorProjectLifecycle,
  ) {
    if (!projectId || !project) return;
    setQuickLifecycleStatus(nextStatus);
    setIsUpdatingStatus(true);
    showLoadingModal('Updating project status', `Switching lifecycle status to ${nextStatus}.`);
    try {
      const updatedProject = await supervisorApi.updateProjectStatus(projectId, {
        lifecycleStatus: nextStatus,
      });
      setProject(updatedProject);
      showSuccessModal('Project status updated', `Lifecycle status is now ${nextStatus}.`);
    } catch (statusException) {
      setQuickLifecycleStatus(previousStatus);
      const apiError = toApiError(statusException, 'Unable to update project status right now.');
      showErrorModal('Unable to update project status', apiError.message, async () =>
        submitQuickStatusChange(nextStatus, previousStatus),
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function handleQuickStatusChange(nextStatus: SupervisorProjectLifecycle) {
    if (!project) return;
    void submitQuickStatusChange(nextStatus, project.lifecycleStatus);
  }

  async function submitLeaderUpdate() {
    if (!projectId || !project || !leaderDraftId || leaderDraftId === project.leader?.id) return;
    setIsUpdatingLeader(true);
    showLoadingModal(
      'Updating project leader',
      'Assigning the selected student as project leader.',
    );
    try {
      const updatedProject = await supervisorApi.updateProject(projectId, {
        title: project.title,
        summary: project.summary ?? '',
        batch: project.batch ?? '',
        semester: project.semester ?? '',
        lifecycleStatus: project.lifecycleStatus,
        healthNote: project.healthNote ?? null,
        leaderStudentId: leaderDraftId,
      });
      setProject(updatedProject);
      showSuccessModal('Project leader updated', 'The project leader was updated successfully.');
    } catch (leaderException) {
      const apiError = toApiError(leaderException, 'Unable to update project leader right now.');
      showErrorModal('Unable to update leader', apiError.message, submitLeaderUpdate);
    } finally {
      setIsUpdatingLeader(false);
    }
  }

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
    } catch (statusException) {
      const apiError = toApiError(statusException, 'Unable to update milestone status right now.');
      showErrorModal('Status update failed', apiError.message, async () =>
        submitQuickMilestoneStatus(milestone, nextStatus),
      );
    } finally {
      setQuickStatusUpdatingId(null);
    }
  }

  function startStudentManagement() {
    setIsManagingStudents(true);
  }

  function cancelStudentManagement() {
    setIsManagingStudents(false);
    setStudentQuery('');
    setStudentSearchResults([]);
    setStudentSearchState('idle');
    setStudentSearchError(null);
    setSelectedStudentsToAdd([]);
  }

  function selectStudentToAdd(student: SupervisorStudentSearchResult) {
    setSelectedStudentsToAdd((current) =>
      current.some((selected) => selected.id === student.id) ? current : [...current, student],
    );
    setStudentQuery('');
    setStudentSearchResults([]);
    setStudentSearchState('idle');
  }

  function removeSelectedStudent(studentId: string) {
    setSelectedStudentsToAdd((current) => current.filter((student) => student.id !== studentId));
  }

  async function submitAddStudents() {
    if (!projectId || selectedStudentsToAdd.length === 0) return;
    setIsAddingStudents(true);
    showLoadingModal('Adding team members', 'Assigning selected students to this project.');
    try {
      const updatedProject = await supervisorApi.addProjectMembers(projectId, {
        studentIds: selectedStudentsToAdd.map((student) => student.id),
      });
      setProject(updatedProject);
      cancelStudentManagement();
      showSuccessModal('Team updated', 'Selected students were added to the project.');
    } catch (addException) {
      const apiError = toApiError(addException, 'Unable to add students right now.');
      showErrorModal('Unable to add students', apiError.message, submitAddStudents);
    } finally {
      setIsAddingStudents(false);
    }
  }

  function addStudents() {
    void submitAddStudents();
  }

  function startAddMilestone() {
    setEditingMilestoneId(null);
    setEditMilestoneForm(null);
    setIsAddingMilestone(true);
  }

  function cancelAddMilestone() {
    setIsAddingMilestone(false);
    setNewMilestoneForm({ title: '', description: '', dueDate: '', status: 'PLANNED' });
  }

  function setNewMilestoneField(field: keyof MilestoneForm, value: string) {
    setNewMilestoneForm((current) => ({ ...current, [field]: value }));
  }

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
      cancelAddMilestone();
      showSuccessModal('Milestone added', 'The milestone was added successfully.');
    } catch (milestoneException) {
      const apiError = toApiError(milestoneException, 'Unable to add milestone right now.');
      showErrorModal('Unable to add milestone', apiError.message, submitMilestoneCreate);
    } finally {
      setIsSavingMilestone(false);
    }
  }

  async function createMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMilestoneCreate();
  }

  function startEditMilestone(milestone: SupervisorProjectDetailMilestone) {
    const nextForm = buildMilestoneForm(milestone);
    setIsAddingMilestone(false);
    setEditingMilestoneId(milestone.id);
    setEditMilestoneForm(nextForm);
    setInitialEditMilestoneForm(nextForm);
  }

  function cancelEditMilestone() {
    setEditingMilestoneId(null);
    setEditMilestoneForm(null);
    setInitialEditMilestoneForm(null);
  }

  function setEditMilestoneField(field: keyof MilestoneForm, value: string) {
    setEditMilestoneForm((current) => (current ? { ...current, [field]: value } : current));
  }

  async function submitMilestoneUpdate() {
    if (!projectId || !editingMilestoneId || !editMilestoneForm || !isEditMilestoneDirty) return;
    setIsSavingMilestone(true);
    showLoadingModal('Saving milestone', 'Updating milestone details and current status.');
    try {
      const updatedProject = await supervisorApi.updateProjectMilestone(
        projectId,
        editingMilestoneId,
        {
          title: editMilestoneForm.title.trim(),
          description: toNullableTrimmed(editMilestoneForm.description),
          dueDate: editMilestoneForm.dueDate,
          status: editMilestoneForm.status,
        },
      );
      setProject(updatedProject);
      cancelEditMilestone();
      showSuccessModal('Milestone updated', 'Milestone changes were saved successfully.');
    } catch (milestoneException) {
      const apiError = toApiError(milestoneException, 'Unable to update milestone right now.');
      showErrorModal('Unable to update milestone', apiError.message, submitMilestoneUpdate);
    } finally {
      setIsSavingMilestone(false);
    }
  }

  async function saveMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMilestoneUpdate();
  }

  const overview: OverviewState = {
    isEditingOverview,
    isSavingOverview,
    overviewForm,
    isOverviewDirty,
    startEdit: startOverviewEdit,
    cancelEdit: cancelOverviewEdit,
    submit: saveOverview,
    setField: setOverviewField,
  };

  const team: TeamState = {
    isManagingStudents,
    studentQuery,
    studentSearchState,
    studentSearchError,
    studentSearchResults,
    selectedStudentsToAdd,
    isAddingStudents,
    leaderDraftId,
    isUpdatingLeader,
    studentMembers,
    setStudentQuery,
    setLeaderDraftId,
    startManagement: startStudentManagement,
    cancelManagement: cancelStudentManagement,
    selectStudentToAdd,
    removeSelectedStudent,
    addStudents,
    submitLeaderUpdate,
  };

  const milestones: MilestonesState = {
    isAddingMilestone,
    isSavingMilestone,
    editingMilestoneId,
    quickStatusUpdatingId,
    newMilestoneForm,
    editMilestoneForm,
    isEditMilestoneDirty,
    startAddMilestone,
    cancelAddMilestone,
    createMilestone,
    startEditMilestone,
    cancelEditMilestone,
    saveMilestone,
    setNewMilestoneField,
    setEditMilestoneField,
    submitQuickMilestoneStatus,
  };

  const requestModalControls: RequestModalControls = {
    state: requestModal,
    close: closeRequestModal,
    retryLastRequest,
  };

  const actions: ProjectDetailsActions = {
    quickLifecycleStatus,
    isUpdatingStatus,
    handleQuickStatusChange,
    handleProjectUpdate,
  };

  return {
    project,
    overview,
    team,
    milestones,
    requestModal: requestModalControls,
    actions,
  };
}
