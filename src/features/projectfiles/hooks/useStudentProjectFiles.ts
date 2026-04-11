import { useEffect, useState } from 'react';
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

export function useStudentProjectFiles(projectId: string | undefined) {
  const [state, setState] = useState<StudentProjectFilesState>({
    files: [],
    config: null,
    isLoading: Boolean(projectId),
    error: null,
  });

  async function reload() {
    if (!projectId) {
      setState({ files: [], config: null, isLoading: false, error: null });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const response = await studentFilesApi.list(projectId);
      setState({ files: response.files, config: response.config, isLoading: false, error: null });
    } catch (error) {
      setState({
        files: [],
        config: null,
        isLoading: false,
        error: isApiException(error) ? error.apiError : UNKNOWN_ERROR,
      });
    }
  }

  async function downloadFile(fileId: string) {
    if (!projectId) {
      return;
    }
    const url = await studentFilesApi.getDownloadUrl(projectId, fileId);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    void reload();
  }, [projectId]);

  return {
    files: state.files,
    config: state.config,
    isLoading: state.isLoading,
    error: state.error,
    reload,
    downloadFile,
  };
}
