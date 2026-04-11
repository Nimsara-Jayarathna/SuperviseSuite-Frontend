import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { studentFilesApi } from '@/features/projectfiles/api/studentFilesApi';
import { FileList } from '@/features/projectfiles/components/FileList';
import { UploadFileModal } from '@/features/projectfiles/components/UploadFileModal';
import { useStudentProjectFiles } from '@/features/projectfiles/hooks/useStudentProjectFiles';
import type { ProjectFile, ProjectFileConfig } from '@/features/projectfiles/types';

type StudentFilesTabSectionProps = {
  projectId: string;
  initialFiles?: {
    items: ProjectFile[];
    config: ProjectFileConfig;
  } | null;
};

export function StudentFilesTabSection({ projectId, initialFiles = null }: StudentFilesTabSectionProps) {
  const { files, config, isLoading, error, hasLoaded, seed, addUploadedFile, load, downloadFile } = useStudentProjectFiles(projectId);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      if (initialFiles?.config) {
        seed(initialFiles.items, initialFiles.config);
      }
    }
  }, [hasLoaded, initialFiles, isLoading, seed]);

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Project Files</h2>
          <p className="text-xs font-medium text-slate-400">Upload and download project documents.</p>
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
      </div>

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
    </section>
  );
}
