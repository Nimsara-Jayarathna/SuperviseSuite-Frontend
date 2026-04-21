import { useEffect, useState } from 'react';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { RefreshCw, Upload } from 'lucide-react';
import { supervisorFilesApi } from '@/features/projectfiles/api/supervisorFilesApi';
import { FileList } from '@/features/projectfiles/components/FileList';
import { UploadFileModal } from '@/features/projectfiles/components/UploadFileModal';
import { DeleteConfirmModal } from '@/features/projectfiles/components/DeleteConfirmModal';
import { useSupervisorProjectFiles } from '@/features/projectfiles/hooks/useSupervisorProjectFiles';
import type { ApiError } from '@/types';
import type { ProjectFile, ProjectFileConfig } from '@/features/projectfiles/types';
import { Button } from '@/components/ui/Button';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { SectionCard } from '@/components/ui/SectionCard';

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
  } = useSupervisorProjectFiles(projectId);
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
    <>
      <SectionCard
        title="Project Files"
        subtitle="Upload, download, and manage project documents."
        actions={
          <>
            <IconActionButton
              label="Refresh files"
              title="Refresh files"
              onClick={() => void refreshFiles()}
              disabled={isLoading}
              icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsUploadOpen(true)}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Upload file
            </Button>
          </>
        }
      >
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
      </SectionCard>

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
    </>
  );
}
