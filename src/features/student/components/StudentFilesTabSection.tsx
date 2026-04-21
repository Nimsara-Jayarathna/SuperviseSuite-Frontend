import { useEffect, useState } from 'react';
import { RefreshCw, Upload } from 'lucide-react';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { Button } from '@/components/ui/Button';
import { studentFilesApi } from '@/features/projectfiles/api/studentFilesApi';
import { FileList } from '@/features/projectfiles/components/FileList';
import { UploadFileModal } from '@/features/projectfiles/components/UploadFileModal';
import { useStudentProjectFiles } from '@/features/projectfiles/hooks/useStudentProjectFiles';
import type { ProjectFile, ProjectFileConfig } from '@/features/projectfiles/types';
import type { ApiError } from '@/types';
import { SectionCard } from '@/components/ui/SectionCard';
import { IconActionButton } from '@/components/ui/IconActionButton';

type StudentFilesTabSectionProps = {
  projectId: string;
  initialFiles?: {
    items: ProjectFile[];
    config: ProjectFileConfig;
  } | null;
};

export function StudentFilesTabSection({
  projectId,
  initialFiles = null,
}: StudentFilesTabSectionProps) {
  const { files, config, isLoading, error, hasLoaded, seed, addUploadedFile, load, downloadFile } =
    useStudentProjectFiles(projectId);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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
      }
    }
  }, [hasLoaded, initialFiles, isLoading, seed]);

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

  return (
    <>
      <SectionCard
        title="Project Files"
        subtitle="Upload and download project documents."
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
            canDelete={false}
            onDownload={(fileId) => void downloadFile(fileId)}
            onDelete={() => {
              // no-op: students cannot delete files
            }}
          />
        ) : null}
      </SectionCard>

      <UploadFileModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={addUploadedFile}
        getUploadUrl={(payload) => studentFilesApi.getUploadUrl(projectId, payload)}
        confirmUpload={(payload) => studentFilesApi.confirmUpload(projectId, payload)}
        maxFileSizeBytes={config?.maxFileSizeBytes}
        maxFileNameLength={config?.maxFileNameLength}
        allowedTypes={config?.allowedTypes}
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
