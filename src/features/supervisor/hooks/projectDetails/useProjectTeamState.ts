import { useEffect, useMemo, useState } from 'react';
import type { ApiError } from '@/types';
import type { SupervisorProjectDetail, SupervisorStudentSearchResult } from '../../types';
import type { SearchState } from '../../projectDetails.shared';
import { toApiError } from '../../projectDetails.shared';

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

type UseProjectTeamStateDeps = {
  projectId: string | undefined;
  project: SupervisorProjectDetail | null;
  setProject: (project: SupervisorProjectDetail) => void;
  showLoadingModal: (title: string, message: string) => void;
  showSuccessModal: (title: string, message: string) => void;
  showErrorModal: (title: string, message: string, retryAction: () => Promise<void>) => void;
  api: {
    searchStudents: (query: string) => Promise<SupervisorStudentSearchResult[]>;
    addProjectMembers: (
      projectId: string,
      payload: { studentIds: string[] },
    ) => Promise<SupervisorProjectDetail>;
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

export function useProjectTeamState({
  projectId,
  project,
  setProject,
  showLoadingModal,
  showSuccessModal,
  showErrorModal,
  api,
}: UseProjectTeamStateDeps): TeamState {
  const { searchStudents } = api;
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

  const studentMembers = useMemo(
    () => project?.members.filter((member) => member.memberRole === 'STUDENT') ?? [],
    [project],
  );

  useEffect(() => {
    setLeaderDraftId(project?.leader?.id ?? '');
  }, [project?.leader?.id]);

  useEffect(() => {
    const normalizedQuery = studentQuery.trim();
    if (!project || !isManagingStudents || normalizedQuery.length < 3) {
      setStudentSearchResults((current) => (current.length > 0 ? [] : current));
      setStudentSearchState((current) => (current !== 'idle' ? 'idle' : current));
      setStudentSearchError((current) => (current !== null ? null : current));
      return;
    }

    let isCancelled = false;
    setStudentSearchState('loading');
    setStudentSearchError((current) => (current !== null ? null : current));

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchStudents(normalizedQuery);
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
        setStudentSearchResults((current) => (current.length > 0 ? [] : current));
        setStudentSearchState('error');
        setStudentSearchError(toApiError(searchException, 'Unable to search students right now.'));
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isManagingStudents, project, searchStudents, selectedStudentsToAdd, studentQuery]);

  function startManagement() {
    setIsManagingStudents(true);
  }

  function cancelManagement() {
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
      const updatedProject = await api.addProjectMembers(projectId, {
        studentIds: selectedStudentsToAdd.map((student) => student.id),
      });
      setProject(updatedProject);
      cancelManagement();
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

  async function submitLeaderUpdate() {
    if (!projectId || !project || !leaderDraftId || leaderDraftId === project.leader?.id) return;
    setIsUpdatingLeader(true);
    showLoadingModal(
      'Updating project leader',
      'Assigning the selected student as project leader.',
    );
    try {
      const updatedProject = await api.updateProject(projectId, {
        title: project.title,
        summary: project.summary ?? '',
        batch: project.batch ?? '',
        semester: project.semester ?? '',
        lifecycleStatus: project.lifecycleStatus,
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

  return {
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
    startManagement,
    cancelManagement,
    selectStudentToAdd,
    removeSelectedStudent,
    addStudents,
    submitLeaderUpdate,
  };
}
