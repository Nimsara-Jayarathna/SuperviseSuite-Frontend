import type { ProjectFile } from '../types';
import { FileListItem } from './FileListItem';

type FileListProps = {
  files: ProjectFile[];
  canDelete: boolean;
  isDeletingFileId?: string | null;
  onDownload: (fileId: string) => void;
  onDelete: (file: ProjectFile) => void;
};

export function FileList({
  files,
  canDelete,
  isDeletingFileId,
  onDownload,
  onDelete,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
        <p className="text-sm font-semibold text-slate-500">No files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <colgroup>
            <col className="w-[280px] max-w-[280px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[260px]" />
            <col className="w-[190px]" />
            <col className="w-[90px]" />
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                File
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Type
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Size
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Uploaded By
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Uploaded
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <FileListItem
                key={file.id}
                file={file}
                canDelete={canDelete}
                isDeleting={isDeletingFileId === file.id}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
