import { useEffect, useState } from 'react';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { buttonStyles } from '@/components/ui/Button';
import { RefreshCw, Upload } from 'lucide-react';
import { supervisorFilesApi } from '@/features/projectfiles/api/supervisorFilesApi';
import { FileList } from '@/features/projectfiles/components/FileList';
import { UploadFileModal } from '@/features/projectfiles/components/UploadFileModal';
import { DeleteConfirmModal } from '@/features/projectfiles/components/DeleteConfirmModal';
import { useSupervisorProjectFiles } from '@/features/projectfiles/hooks/useSupervisorProjectFiles';
import type { ApiError } from '@/types';
import type { ProjectFile, ProjectFileConfig } from '@/features/projectfiles/types';

type FilesTabSectionProps = {
  projectId: string;
  initialFiles?: {
    items: ProjectFile[];
    config: ProjectFileConfig;
  } | null;
};

export function FilesTabSection({ projectId, initialFiles = null }: FilesTabSectionProps) {
  const {
    files,
    config,
    isLoading,
    error,
    hasLoaded,
    seed,
    addUploadedFile,
    removeDeletedFile,
    load,
    downloadFile,
    deleteFile,
  } =
    useSupervisorProjectFiles(projectId);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filePendingDelete, setFilePendingDelete] = useState<ProjectFile | null>(null);
  const [requestModal, setRequestModal] = useState<{
    isOpen: boolean;
    status: 'loading' | 'success' | 'error';
    title: string;
    message: string;
    retryAction: (() => void) | null;
  }>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
    retryAction: null,
  });

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      if (initialFiles?.config) {
        seed(initialFiles.items, initialFiles.config);
        return;
      }
      void load();
    }
  }, [hasLoaded, initialFiles, isLoading, load, seed]);

  async function refreshFiles() {
    if (isLoading) {
      return;
    }
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Refreshing project files',
      message: 'Fetching the latest files for this project.',
      retryAction: null,
    });

    const result = await load();
    if (result.ok) {
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: 'Project files refreshed',
        message: 'You are viewing the latest files.',
        retryAction: null,
      });
      return;
    }

    const refreshError: ApiError | undefined = result.error;
    setRequestModal({
      isOpen: true,
      status: 'error',
      title: 'Unable to refresh files',
      message: refreshError?.message ?? 'Unable to refresh files right now.',
      retryAction: () => {
        void refreshFiles();
      },
    });
  }

  async function confirmDeleteFile() {
    if (!filePendingDelete) {
      return;
    }

    const targetFileId = filePendingDelete.id;
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Deleting file',
      message: 'Removing file from project storage.',
      retryAction: null,
    });

    const result = await deleteFile(targetFileId);
    if (result.ok) {
      removeDeletedFile(targetFileId);
      setFilePendingDelete(null);
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: 'File deleted',
        message: 'File was removed successfully.',
        retryAction: null,
      });
      return;
    }

    setRequestModal({
      isOpen: true,
      status: 'error',
      title: 'Unable to delete file',
      message: result.error?.message ?? 'Unable to delete file right now.',
      retryAction: () => {
        void confirmDeleteFile();
      },
    });
  }

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Files</h2>
          <p className="text-xs font-medium text-slate-400">Upload, download, and manage project documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={() => void refreshFiles()}
            disabled={isLoading}
            title="Refresh files"
            aria-label="Refresh files"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            className={buttonStyles({ variant: 'primary', size: 'sm' })}
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload file
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Loading files...
          </div>
        ) : null}

        {error ? <ErrorState error={error} onRetry={() => void load()} /> : null}

        {!isLoading && !error ? (
          <FileList
            files={files}
            canDelete
            onDownload={(fileId) => void downloadFile(fileId)}
            onDelete={(file) => setFilePendingDelete(file)}
          />
        ) : null}
      </div>

      <UploadFileModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={addUploadedFile}
        getUploadUrl={(payload) => supervisorFilesApi.getUploadUrl(projectId, payload)}
        confirmUpload={(payload) => supervisorFilesApi.confirmUpload(projectId, payload)}
        maxFileSizeBytes={config?.maxFileSizeBytes}
        maxFileNameLength={config?.maxFileNameLength}
        allowedTypes={config?.allowedTypes}
      />

      <DeleteConfirmModal
        isOpen={Boolean(filePendingDelete)}
        fileName={filePendingDelete?.fileName ?? null}
        onCancel={() => setFilePendingDelete(null)}
        onConfirm={() => void confirmDeleteFile()}
      />

      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        onClose={() => setRequestModal((current) => ({ ...current, isOpen: false }))}
        onRetry={requestModal.retryAction ?? undefined}
      />
    </section>
  );
}
