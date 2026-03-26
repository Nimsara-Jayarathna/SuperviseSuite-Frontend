import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import { invalidateSupervisorProjectsCache } from './useSupervisorProjects';
import type { CreateSupervisorProjectResponse, SupervisorStudentSearchResult } from '../types';
import {
  INITIAL_DRAFT,
  INITIAL_MILESTONE,
  buildStudentLabel,
  earliestMilestone,
  isMilestoneComplete,
} from '../createProject.shared';
import type {
  CreateProjectStepId,
  DraftState,
  MilestoneDraft,
  RequestModalState,
  SearchState,
} from '../createProject.shared';

type UseCreateProjectPageStateParams = {
  onSuccessNavigate: () => void;
};

export function useCreateProjectPageState({ onSuccessNavigate }: UseCreateProjectPageStateParams) {
  const [currentStep, setCurrentStep] = useState<CreateProjectStepId>(1);
  const [draft, setDraft] = useState<DraftState>(INITIAL_DRAFT);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([{ ...INITIAL_MILESTONE }]);
  const [expandedMilestoneIndex, setExpandedMilestoneIndex] = useState<number | null>(0);
  const milestoneRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [studentQuery, setStudentQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<SupervisorStudentSearchResult[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SupervisorStudentSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

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
  const step3Valid = milestones.every(isMilestoneComplete);
  const incompleteMilestoneCount = milestones.filter(
    (milestone) => !isMilestoneComplete(milestone),
  ).length;
  const shouldShowSearchPanel =
    studentQuery.trim().length >= 3 || searchState === 'loading' || searchState === 'error';
  const primaryCreatedMilestone = createdProject
    ? earliestMilestone(createdProject.milestones)
    : null;

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
        const visible = results.filter(
          (student) => !selectedStudents.some((selected) => selected.id === student.id),
        );
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
      if (prev.some((existing) => existing.id === student.id)) return prev;
      return [...prev, student];
    });
    setStudentQuery('');
    setSearchResults([]);
    setSearchState('idle');
    setSearchError(null);
  }

  function removeStudent(id: string) {
    setSelectedStudents((prev) => prev.filter((student) => student.id !== id));
    setSelectedLeaderId((current) => (current === id ? null : current));
  }

  function updateMilestone<F extends keyof MilestoneDraft>(
    index: number,
    field: F,
    value: MilestoneDraft[F],
  ) {
    setMilestones((prev) =>
      prev.map((milestone, milestoneIndex) =>
        milestoneIndex === index ? { ...milestone, [field]: value } : milestone,
      ),
    );
  }

  function addMilestone() {
    const newIndex = milestones.length;
    setMilestones((prev) => [...prev, { ...INITIAL_MILESTONE }]);
    setExpandedMilestoneIndex(newIndex);
    setTimeout(() => {
      milestoneRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  function removeMilestone(index: number) {
    if (milestones.length === 1) return;
    setMilestones((prev) => prev.filter((_, milestoneIndex) => milestoneIndex !== index));
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

  function toggleMilestone(index: number) {
    setExpandedMilestoneIndex((current) => (current === index ? null : index));
  }

  function goStep(step: CreateProjectStepId) {
    setCurrentStep(step);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      setSelectedStudents([]);
      setSelectedLeaderId(null);
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
    incompleteMilestoneCount,
    shouldShowSearchPanel,
    primaryCreatedMilestone,
    goStep,
    updateDraft,
    setStudentQuery,
    selectStudent,
    removeStudent,
    setSelectedLeaderId,
    updateMilestone,
    addMilestone,
    removeMilestone,
    toggleMilestone,
    setShowIncompleteHint,
    handleSubmit,
    closeRequestModal,
    buildStudentLabel,
  };
}
