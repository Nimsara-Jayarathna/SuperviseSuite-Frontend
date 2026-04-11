import { Download, Trash2 } from 'lucide-react';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { ProjectFile } from '../types';
import { getFileTypeDisplay } from '../fileTypeDisplay';

type FileListItemProps = {
  file: ProjectFile;
  canDelete: boolean;
  onDownload: (fileId: string) => void;
  onDelete: (file: ProjectFile) => void;
};

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

export function FileListItem({ file, canDelete, onDownload, onDelete }: FileListItemProps) {
  const typeDisplay = getFileTypeDisplay(file.fileType, file.fileName);

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="max-w-[280px] px-4 py-3 text-sm font-semibold text-slate-800">
        <span className="block truncate" title={file.fileName}>
          {file.fileName}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${typeDisplay.toneClassName}`}
        >
          {typeDisplay.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs font-semibold text-slate-600">
        {formatFileSize(file.fileSize)}
      </td>
      <td className="max-w-0 px-4 py-3 w-[260px] text-xs text-slate-500">
        <div className="inline-flex items-center gap-2">
          <span
            className="max-w-[140px] truncate font-semibold text-slate-700"
            title={file.uploadedByName}
          >
            {file.uploadedByName}
          </span>
          <RoleBadge role={file.uploadedByRole} className="shrink-0 px-2 py-0.5 text-[10px]" />
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {dateTimeFormatter.format(new Date(file.createdAt))}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
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
      </td>
    </tr>
  );
}
