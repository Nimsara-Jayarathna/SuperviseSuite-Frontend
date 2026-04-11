import { Download, Trash2 } from 'lucide-react';
import type { ProjectFile } from '../types';

type FileListItemProps = {
  file: ProjectFile;
  canDelete: boolean;
  isDeleting: boolean;
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

export function FileListItem({
  file,
  canDelete,
  isDeleting,
  onDownload,
  onDelete,
}: FileListItemProps) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{file.fileName}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{file.fileType || 'Unknown'}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{formatFileSize(file.fileSize)}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{file.uploadedByName}</td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {dateTimeFormatter.format(new Date(file.updatedAt ?? file.createdAt))}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onDownload(file.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={() => onDelete(file)}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
