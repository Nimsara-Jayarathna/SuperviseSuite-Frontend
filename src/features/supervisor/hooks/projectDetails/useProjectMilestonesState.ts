import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { buildMilestoneForm, toApiError, toNullableTrimmed } from '../../projectDetails.shared';
import type { MilestoneForm, MilestoneStatus } from '../../projectDetails.shared';
import {
  isTerminalMilestoneStatus,
  validateMilestoneAddPolicy,
  validateMilestoneUpdatePolicy,
} from '../../milestonePolicy';
import type { SupervisorProjectDetail, SupervisorProjectDetailMilestone } from '../../types';

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

type UseProjectMilestonesStateParams = {
  projectId: string | undefined;
  project: SupervisorProjectDetail | null;
  setProject: (next: SupervisorProjectDetail) => void;
  showLoadingModal: (title: string, message: string) => void;
  showSuccessModal: (title: string, message: string) => void;
  showErrorModal: (title: string, message: string, retryAction: () => Promise<void>) => void;
  showValidationModal: (title: string, message: string) => void;
  api: {
    addProjectMilestone: (
      projectId: string,
      payload: { title: string; description: string | null; dueDate: string },
    ) => Promise<SupervisorProjectDetail>;
    updateProjectMilestone: (
      projectId: string,
      milestoneId: string,
      payload: {
        title: string;
        description: string | null;
        dueDate: string;
        status: MilestoneStatus;
      },
    ) => Promise<SupervisorProjectDetail>;
  };
};

export function useProjectMilestonesState({
  projectId,
  project,
  setProject,
  showLoadingModal,
  showSuccessModal,
  showErrorModal,
  showValidationModal,
  api,
}: UseProjectMilestonesStateParams): MilestonesState {
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

  const isEditMilestoneDirty = useMemo(() => {
    if (!editMilestoneForm || !initialEditMilestoneForm) return false;
    return (
      editMilestoneForm.title !== initialEditMilestoneForm.title ||
      editMilestoneForm.description !== initialEditMilestoneForm.description ||
      editMilestoneForm.dueDate !== initialEditMilestoneForm.dueDate ||
      editMilestoneForm.status !== initialEditMilestoneForm.status
    );
  }, [editMilestoneForm, initialEditMilestoneForm]);

  async function submitQuickMilestoneStatus(
    milestone: SupervisorProjectDetailMilestone,
    nextStatus: MilestoneStatus,
  ) {
    if (!projectId || !project) return;
    const validationError = validateMilestoneUpdatePolicy({
      milestones: project.milestones,
      targetMilestoneId: milestone.id,
      currentStatus: milestone.status,
      nextStatus,
      currentDueDate: milestone.dueDate,
      nextDueDate: milestone.dueDate,
    });
    if (validationError) {
      showValidationModal('Status update blocked', validationError);
      return;
    }

    setQuickStatusUpdatingId(milestone.id);
    try {
      const updatedProject = await api.updateProjectMilestone(projectId, milestone.id, {
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
    if (!projectId || !project) return;
    const validationError = validateMilestoneAddPolicy(
      project.milestones,
      newMilestoneForm.dueDate,
    );
    if (validationError) {
      showValidationModal('Unable to add milestone', validationError);
      return;
    }

    setIsSavingMilestone(true);
    showLoadingModal('Adding milestone', 'Creating a new milestone for this project.');
    try {
      const updatedProject = await api.addProjectMilestone(projectId, {
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
    if (isTerminalMilestoneStatus(milestone.status)) {
      return;
    }
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
    if (
      !projectId ||
      !editingMilestoneId ||
      !editMilestoneForm ||
      !isEditMilestoneDirty ||
      !project
    ) {
      return;
    }
    const currentMilestone = project.milestones.find(
      (milestone) => milestone.id === editingMilestoneId,
    );
    if (!currentMilestone) {
      return;
    }

    const validationError = validateMilestoneUpdatePolicy({
      milestones: project.milestones,
      targetMilestoneId: editingMilestoneId,
      currentStatus: currentMilestone.status,
      nextStatus: editMilestoneForm.status,
      currentDueDate: currentMilestone.dueDate,
      nextDueDate: editMilestoneForm.dueDate,
    });
    if (validationError) {
      showValidationModal('Unable to update milestone', validationError);
      return;
    }

    setIsSavingMilestone(true);
    showLoadingModal('Saving milestone', 'Updating milestone details and current status.');
    try {
      const updatedProject = await api.updateProjectMilestone(projectId, editingMilestoneId, {
        title: editMilestoneForm.title.trim(),
        description: toNullableTrimmed(editMilestoneForm.description),
        dueDate: editMilestoneForm.dueDate,
        status: editMilestoneForm.status,
      });
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

  return {
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
}
