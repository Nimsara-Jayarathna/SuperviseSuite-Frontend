import { useState } from 'react';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { Upload } from 'lucide-react';
import { supervisorFilesApi } from '@/features/projectfiles/api/supervisorFilesApi';
import { FileList } from '@/features/projectfiles/components/FileList';
import { UploadFileModal } from '@/features/projectfiles/components/UploadFileModal';
import { DeleteConfirmModal } from '@/features/projectfiles/components/DeleteConfirmModal';
import { useSupervisorProjectFiles } from '@/features/projectfiles/hooks/useSupervisorProjectFiles';
import type { ProjectFile } from '@/features/projectfiles/types';

type FilesTabSectionProps = {
  projectId: string;
};

export function FilesTabSection({ projectId }: FilesTabSectionProps) {
  const { files, config, isLoading, error, reload, downloadFile, deleteFile, isDeletingFileId } =
    useSupervisorProjectFiles(projectId);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filePendingDelete, setFilePendingDelete] = useState<ProjectFile | null>(null);

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Files</h2>
          <p className="text-xs font-medium text-slate-400">Upload, download, and manage project documents.</p>
        </div>
        <button
          type="button"
          className={buttonStyles({ variant: 'primary', size: 'sm' })}
          onClick={() => setIsUploadOpen(true)}
        >
          <Upload className="h-4 w-4" />
          Upload file
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Loading files...
          </div>
        ) : null}

        {error ? <ErrorState error={error} onRetry={() => void reload()} /> : null}

        {!isLoading && !error ? (
          <FileList
            files={files}
            canDelete
            isDeletingFileId={isDeletingFileId}
            onDownload={(fileId) => void downloadFile(fileId)}
            onDelete={(file) => setFilePendingDelete(file)}
          />
        ) : null}
      </div>

      <UploadFileModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={reload}
        getUploadUrl={(payload) => supervisorFilesApi.getUploadUrl(projectId, payload)}
        confirmUpload={(payload) => supervisorFilesApi.confirmUpload(projectId, payload)}
        maxFileSizeBytes={config?.maxFileSizeBytes}
        maxFileNameLength={config?.maxFileNameLength}
        allowedTypes={config?.allowedTypes}
      />

      <DeleteConfirmModal
        isOpen={Boolean(filePendingDelete)}
        fileName={filePendingDelete?.fileName ?? null}
        isDeleting={Boolean(filePendingDelete && isDeletingFileId === filePendingDelete.id)}
        onCancel={() => setFilePendingDelete(null)}
        onConfirm={() => {
          if (!filePendingDelete) {
            return;
          }
          void deleteFile(filePendingDelete.id).finally(() => setFilePendingDelete(null));
        }}
      />
    </section>
  );
}
