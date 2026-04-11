import { useCallback, useEffect, useState } from 'react';
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

export function useSupervisorProjectFiles(projectId: string | undefined, lazy = true) {
  const [state, setState] = useState<SupervisorProjectFilesState>({
    files: [],
    config: null,
    isLoading: false,
    error: null,
  });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isDeletingFileId, setIsDeletingFileId] = useState<string | null>(null);

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
      const response = await supervisorFilesApi.list(projectId);
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

  async function deleteFile(fileId: string) {
    if (!projectId) {
      return;
    }
    setIsDeletingFileId(fileId);
    try {
      await supervisorFilesApi.delete(projectId, fileId);
      await load();
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
    isDeletingFileId,
    load,
    reload: async () => {
      await load();
    },
    deleteFile,
    downloadFile,
  };
}
