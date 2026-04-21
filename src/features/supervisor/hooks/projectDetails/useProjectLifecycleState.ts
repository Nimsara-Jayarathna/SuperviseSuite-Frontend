import { useEffect, useState } from 'react';
import { toApiError } from '../../projectDetails.shared';
import type { SupervisorProjectDetail, SupervisorProjectLifecycle } from '../../types';

export type ProjectLifecycleState = {
  quickLifecycleStatus: SupervisorProjectLifecycle;
  isUpdatingStatus: boolean;
  handleQuickStatusChange: (nextStatus: SupervisorProjectLifecycle) => void;
};

type UseProjectLifecycleStateParams = {
  projectId: string | undefined;
  project: SupervisorProjectDetail | null;
  setProject: (next: SupervisorProjectDetail) => void;
  showLoadingModal: (title: string, message: string) => void;
  showSuccessModal: (title: string, message: string) => void;
  showErrorModal: (title: string, message: string, retryAction: () => Promise<void>) => void;
  api: {
    updateProjectStatus: (
      projectId: string,
      payload: { lifecycleStatus: SupervisorProjectLifecycle },
    ) => Promise<SupervisorProjectDetail>;
  };
};

export function useProjectLifecycleState({
  projectId,
  project,
  setProject,
  showLoadingModal,
  showSuccessModal,
  showErrorModal,
  api,
}: UseProjectLifecycleStateParams): ProjectLifecycleState {
  const [quickLifecycleStatus, setQuickLifecycleStatus] =
    useState<SupervisorProjectLifecycle>('PLANNING');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (project && !isUpdatingStatus) setQuickLifecycleStatus(project.lifecycleStatus);
  }, [project, isUpdatingStatus]);

  async function submitQuickStatusChange(
    nextStatus: SupervisorProjectLifecycle,
    previousStatus: SupervisorProjectLifecycle,
  ) {
    if (!projectId || !project) return;
    setQuickLifecycleStatus(nextStatus);
    setIsUpdatingStatus(true);
    showLoadingModal('Updating project status', `Switching lifecycle status to ${nextStatus}.`);
    try {
      const updatedProject = await api.updateProjectStatus(projectId, {
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

  return { quickLifecycleStatus, isUpdatingStatus, handleQuickStatusChange };
}
