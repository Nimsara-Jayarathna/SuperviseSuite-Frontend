import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { buildOverviewEditForm, toApiError } from '../../projectDetails.shared';
import type { OverviewEditForm } from '../../projectDetails.shared';
import type { SupervisorProjectDetail } from '../../types';

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

type UseProjectOverviewStateParams = {
  projectId: string | undefined;
  project: SupervisorProjectDetail | null;
  setProject: (next: SupervisorProjectDetail) => void;
  showLoadingModal: (title: string, message: string) => void;
  showSuccessModal: (title: string, message: string) => void;
  showErrorModal: (title: string, message: string, retryAction: () => Promise<void>) => void;
  api: {
    updateProject: (
      projectId: string,
      payload: {
        title: string;
        summary: string;
        batch: string;
        semester: string;
        lifecycleStatus: SupervisorProjectDetail['lifecycleStatus'];
        leaderStudentId: string | null;
      },
    ) => Promise<SupervisorProjectDetail>;
  };
};

export function useProjectOverviewState({
  projectId,
  project,
  setProject,
  showLoadingModal,
  showSuccessModal,
  showErrorModal,
  api,
}: UseProjectOverviewStateParams): OverviewState {
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [isSavingOverview, setIsSavingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState<OverviewEditForm | null>(null);

  useEffect(() => {
    if (project && !isEditingOverview) setOverviewForm(buildOverviewEditForm(project));
  }, [project, isEditingOverview]);

  const initialOverviewForm = project ? buildOverviewEditForm(project) : null;
  const isOverviewDirty = useMemo(() => {
    if (!overviewForm || !initialOverviewForm) return false;
    return (
      overviewForm.title !== initialOverviewForm.title ||
      overviewForm.summary !== initialOverviewForm.summary ||
      overviewForm.batch !== initialOverviewForm.batch ||
      overviewForm.semester !== initialOverviewForm.semester ||
      overviewForm.lifecycleStatus !== initialOverviewForm.lifecycleStatus
    );
  }, [overviewForm, initialOverviewForm]);

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
      const updatedProject = await api.updateProject(projectId, {
        title: overviewForm.title.trim(),
        summary: overviewForm.summary.trim(),
        batch: overviewForm.batch.trim(),
        semester: overviewForm.semester.trim(),
        lifecycleStatus: overviewForm.lifecycleStatus,
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

  return {
    isEditingOverview,
    isSavingOverview,
    overviewForm,
    isOverviewDirty,
    startEdit: startOverviewEdit,
    cancelEdit: cancelOverviewEdit,
    submit: saveOverview,
    setField: setOverviewField,
  };
}
