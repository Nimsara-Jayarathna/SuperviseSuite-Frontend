import { useCallback, useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type { ProjectFile, ProjectFileConfig } from '../types';
import { studentFilesApi } from '../api/studentFilesApi';

type StudentProjectFilesState = {
  files: ProjectFile[];
  config: ProjectFileConfig | null;
  isLoading: boolean;
  error: ApiError | null;
};

const UNKNOWN_ERROR: ApiError = {
  code: 'INTERNAL_ERROR',
  message: 'Unable to load project files right now.',
  details: [],
  timestamp: new Date().toISOString(),
  status: 0,
  error: 'Unexpected Error',
  path: '',
  traceId: null,
};

export function useStudentProjectFiles(projectId: string | undefined, lazy = true) {
  const [state, setState] = useState<StudentProjectFilesState>({
    files: [],
    config: null,
    isLoading: false,
    error: null,
  });
  const [hasLoaded, setHasLoaded] = useState(false);

  const seed = useCallback((files: ProjectFile[], config: ProjectFileConfig) => {
    setState({
      files,
      config,
      isLoading: false,
      error: null,
    });
    setHasLoaded(true);
  }, []);

  const addUploadedFile = useCallback((uploadedFile: ProjectFile) => {
    setState((current) => ({
      ...current,
      files: [uploadedFile, ...current.files.filter((file) => file.id !== uploadedFile.id)],
      error: null,
    }));
    setHasLoaded(true);
  }, []);

  const load = useCallback(async () => {
    if (!projectId) {
      setState({ files: [], config: null, isLoading: false, error: null });
      setHasLoaded(false);
      return { ok: false as const };
    }

    if (state.isLoading) {
      return { ok: false as const };
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const response = await studentFilesApi.list(projectId);
      setState({ files: response.files, config: response.config, isLoading: false, error: null });
      setHasLoaded(true);
      return { ok: true as const };
    } catch (error) {
      const apiError = isApiException(error) ? error.apiError : UNKNOWN_ERROR;
      setState({
        files: [],
        config: null,
        isLoading: false,
        error: apiError,
      });
      return { ok: false as const, error: apiError };
    }
  }, [projectId, state.isLoading]);

  async function downloadFile(fileId: string) {
    if (!projectId) {
      return;
    }
    const url = await studentFilesApi.getDownloadUrl(projectId, fileId);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    setState({ files: [], config: null, isLoading: false, error: null });
    setHasLoaded(false);
  }, [projectId]);

  useEffect(() => {
    if (!lazy && projectId) {
      void load();
    }
  }, [lazy, load, projectId]);

  return {
    files: state.files,
    config: state.config,
    isLoading: state.isLoading,
    error: state.error,
    hasLoaded,
    seed,
    addUploadedFile,
    load,
    reload: async () => {
      await load();
    },
    downloadFile,
  };
}
