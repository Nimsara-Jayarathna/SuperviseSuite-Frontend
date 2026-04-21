import { RoleBadge } from '@/components/ui/RoleBadge';
import { useIsMobileLayout } from '@/components/ui/useIsMobileLayout';
import { Download, Trash2 } from 'lucide-react';
import type { ProjectFile } from '../types';
import { getFileTypeDisplay } from '../fileTypeDisplay';
import { FileListItem } from './FileListItem';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { DataTable } from '@/components/ui/DataTable';

type FileListProps = {
  files: ProjectFile[];
  canDelete: boolean;
  onDownload: (fileId: string) => void;
  onDelete: (file: ProjectFile) => void;
};

export function FileList({ files, canDelete, onDownload, onDelete }: FileListProps) {
  const isMobileLayout = useIsMobileLayout();

  if (files.length === 0) {
    return <EmptyStateCard message="No files uploaded yet." />;
  }

  if (isMobileLayout) {
    return (
      <div className="space-y-3">
        {files.map((file) => {
          const typeDisplay = getFileTypeDisplay(file.fileType, file.fileName);

          return (
            <article
              key={file.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-semibold text-slate-800"
                    title={file.fileName}
                  >
                    {file.fileName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${typeDisplay.toneClassName}`}
                    >
                      {typeDisplay.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {formatFileSize(file.fileSize)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDownload(file.id)}
                    title="Download file"
                    aria-label="Download file"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(file)}
                      title="Delete file"
                      aria-label="Delete file"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {file.uploadedByName}
                  </span>
                  <RoleBadge
                    role={file.uploadedByRole}
                    className="shrink-0 px-2 py-0.5 text-[10px]"
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {dateTimeFormatter.format(new Date(file.createdAt))}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <DataTable
      colGroup={
        <colgroup>
          <col className="w-[280px] max-w-[280px]" />
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[260px]" />
          <col className="w-[190px]" />
          <col className="w-[90px]" />
        </colgroup>
      }
      columns={[
        { key: 'file', header: 'File', className: 'whitespace-nowrap' },
        { key: 'type', header: 'Type', className: 'whitespace-nowrap' },
        { key: 'size', header: 'Size', className: 'whitespace-nowrap' },
        { key: 'uploadedBy', header: 'Uploaded By', className: 'whitespace-nowrap' },
        { key: 'uploaded', header: 'Uploaded', className: 'whitespace-nowrap' },
        { key: 'actions', header: 'Actions', align: 'right', className: 'whitespace-nowrap' },
      ]}
    >
      {files.map((file) => (
        <FileListItem
          key={file.id}
          file={file}
          canDelete={canDelete}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </DataTable>
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
