import { useState } from 'react';
import type { FormEvent } from 'react';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import { invalidateSupervisorProjectsCache } from './useSupervisorProjects';
import type { CreateSupervisorProjectResponse, SupervisorStudentSearchResult } from '../types';
import { INITIAL_DRAFT } from '../createProject.shared';
import type { CreateProjectStepId, DraftState, RequestModalState } from '../createProject.shared';
import { useCreateProjectMilestonesState } from './projectCreate/useCreateProjectMilestonesState';
import { useCreateProjectStudentSearchState } from './projectCreate/useCreateProjectStudentSearchState';

type UseCreateProjectPageStateParams = {
  onSuccessNavigate: () => void;
};

export function useCreateProjectPageState({ onSuccessNavigate }: UseCreateProjectPageStateParams) {
  const [currentStep, setCurrentStep] = useState<CreateProjectStepId>(1);
  const [draft, setDraft] = useState<DraftState>(INITIAL_DRAFT);
  const [selectedStudents, setSelectedStudents] = useState<SupervisorStudentSearchResult[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showIncompleteHint, setShowIncompleteHint] = useState(false);
  const [createdProject, setCreatedProject] = useState<CreateSupervisorProjectResponse | null>(
    null,
  );
  const [requestModal, setRequestModal] = useState<RequestModalState>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });

  const step1Valid = draft.title.trim().length > 0 && draft.summary.trim().length > 0;
  const step2Valid = selectedStudents.length > 0;
  const milestonesState = useCreateProjectMilestonesState({ createdProject });
  const studentSearchState = useCreateProjectStudentSearchState({
    selectedStudents,
    setSelectedStudents,
    selectedLeaderId,
    setSelectedLeaderId,
    searchStudents: supervisorApi.searchStudents,
    isApiException,
  });

  const { milestones, milestoneRefs, expandedMilestoneIndex } = milestonesState;
  const { studentQuery, setStudentQuery, searchResults, searchState, searchError } =
    studentSearchState;
  const { milestonePolicyError, step3Valid, incompleteMilestoneCount, shouldShowSearchPanel } = {
    milestonePolicyError: milestonesState.milestonePolicyError,
    step3Valid: milestonesState.step3Valid,
    incompleteMilestoneCount: milestonesState.incompleteMilestoneCount,
    shouldShowSearchPanel: studentSearchState.shouldShowSearchPanel,
  };
  const primaryCreatedMilestone = milestonesState.primaryCreatedMilestone;

  function updateDraft<F extends keyof DraftState>(field: F, value: DraftState[F]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function goStep(step: CreateProjectStepId) {
    setCurrentStep(step);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!step3Valid) {
      setShowIncompleteHint(true);
      setSubmitError(null);
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
        studentIds: selectedStudents.map((student) => student.id),
        leaderStudentId: selectedLeaderId,
        milestones: milestones.map((milestone) => ({
          title: milestone.title.trim(),
          description: milestone.description.trim(),
          dueDate: milestone.dueDate,
        })),
      });

      setCreatedProject(response);
      invalidateSupervisorProjectsCache();
      setDraft(INITIAL_DRAFT);
      studentSearchState.resetStudentSelection();
      milestonesState.resetMilestones();
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
    if (nextStatus === 'success') onSuccessNavigate();
  }

  return {
    currentStep,
    draft,
    milestones,
    expandedMilestoneIndex,
    milestoneRefs,
    studentQuery,
    selectedStudents,
    selectedLeaderId,
    searchResults,
    searchState,
    searchError,
    isSubmitting,
    submitError,
    showIncompleteHint,
    createdProject,
    requestModal,
    step1Valid,
    step2Valid,
    step3Valid,
    milestonePolicyError,
    incompleteMilestoneCount,
    shouldShowSearchPanel,
    primaryCreatedMilestone,
    goStep,
    updateDraft,
    setStudentQuery,
    selectStudent: studentSearchState.selectStudent,
    removeStudent: studentSearchState.removeStudent,
    setSelectedLeaderId,
    updateMilestone: milestonesState.updateMilestone,
    addMilestone: milestonesState.addMilestone,
    removeMilestone: milestonesState.removeMilestone,
    toggleMilestone: milestonesState.toggleMilestone,
    setShowIncompleteHint,
    handleSubmit,
    closeRequestModal,
    buildStudentLabel: studentSearchState.buildStudentLabel,
  };
}
