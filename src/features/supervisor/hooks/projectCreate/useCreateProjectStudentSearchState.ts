import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SearchState } from '../../createProject.shared';
import { buildStudentLabel } from '../../createProject.shared';
import type { SupervisorStudentSearchResult } from '../../types';

type UseCreateProjectStudentSearchStateParams = {
  selectedStudents: SupervisorStudentSearchResult[];
  setSelectedStudents: Dispatch<SetStateAction<SupervisorStudentSearchResult[]>>;
  selectedLeaderId: string | null;
  setSelectedLeaderId: Dispatch<SetStateAction<string | null>>;
  searchStudents: (query: string) => Promise<SupervisorStudentSearchResult[]>;
  isApiException: (error: unknown) => error is { apiError: { message: string } };
};

export function useCreateProjectStudentSearchState({
  selectedStudents,
  setSelectedStudents,
  selectedLeaderId,
  setSelectedLeaderId,
  searchStudents,
  isApiException,
}: UseCreateProjectStudentSearchStateParams) {
  const [studentQuery, setStudentQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SupervisorStudentSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

  const shouldShowSearchPanel =
    studentQuery.trim().length >= 3 || searchState === 'loading' || searchState === 'error';

  useEffect(() => {
    const normalizedQuery = studentQuery.trim();
    if (normalizedQuery.length < 3) {
      setSearchResults((current) => (current.length > 0 ? [] : current));
      setSearchState((current) => (current !== 'idle' ? 'idle' : current));
      setSearchError((current) => (current !== null ? null : current));
      return;
    }

    let isCancelled = false;
    setSearchState('loading');
    setSearchError((current) => (current !== null ? null : current));

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchStudents(normalizedQuery);
        if (isCancelled) return;
        const visible = results.filter(
          (student) => !selectedStudents.some((selected) => selected.id === student.id),
        );
        setSearchResults(visible);
        setSearchState(visible.length > 0 ? 'results' : 'empty');
      } catch (error) {
        if (isCancelled) return;
        setSearchResults((current) => (current.length > 0 ? [] : current));
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
  }, [isApiException, searchStudents, selectedStudents, studentQuery]);

  function selectStudent(student: SupervisorStudentSearchResult) {
    setSelectedStudents((prev) =>
      prev.some((existing) => existing.id === student.id) ? prev : [...prev, student],
    );
    setStudentQuery('');
    setSearchResults([]);
    setSearchState('idle');
    setSearchError(null);
  }

  function removeStudent(id: string) {
    setSelectedStudents((prev) => prev.filter((student) => student.id !== id));
    setSelectedLeaderId((current) => (current === id ? null : current));
  }

  function reset() {
    setSelectedStudents([]);
    setSelectedLeaderId(null);
    setStudentQuery('');
    setSearchResults([]);
    setSearchState('idle');
    setSearchError(null);
  }

  return {
    studentQuery,
    setStudentQuery,
    selectedStudents,
    selectStudent,
    removeStudent,
    selectedLeaderId,
    setSelectedLeaderId,
    searchResults,
    searchState,
    searchError,
    shouldShowSearchPanel,
    resetStudentSelection: reset,
    buildStudentLabel,
  };
}
