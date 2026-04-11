import { useEffect, useState } from 'react';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import type { ProjectFile, ProjectFileConfig } from '../types';
import { supervisorFilesApi } from '../api/supervisorFilesApi';

type SupervisorProjectFilesState = {
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

export function useSupervisorProjectFiles(projectId: string | undefined) {
  const [state, setState] = useState<SupervisorProjectFilesState>({
    files: [],
    config: null,
    isLoading: Boolean(projectId),
    error: null,
  });
  const [isDeletingFileId, setIsDeletingFileId] = useState<string | null>(null);

  async function reload() {
    if (!projectId) {
      setState({ files: [], config: null, isLoading: false, error: null });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const response = await supervisorFilesApi.list(projectId);
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

  async function deleteFile(fileId: string) {
    if (!projectId) {
      return;
    }
    setIsDeletingFileId(fileId);
    try {
      await supervisorFilesApi.delete(projectId, fileId);
      await reload();
    } finally {
      setIsDeletingFileId(null);
    }
  }

  async function downloadFile(fileId: string) {
    if (!projectId) {
      return;
    }
    const url = await supervisorFilesApi.getDownloadUrl(projectId, fileId);
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
    isDeletingFileId,
    reload,
    deleteFile,
    downloadFile,
  };
}
