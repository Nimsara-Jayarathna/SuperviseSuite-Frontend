export type FileTypeDisplay = {
  label: string;
  toneClassName: string;
};

const FILE_TYPE_CONFIG: Record<string, FileTypeDisplay> = {
  pdf: { label: 'PDF', toneClassName: 'bg-rose-100 text-rose-700 border border-rose-200' },
  doc: { label: 'DOC', toneClassName: 'bg-blue-100 text-blue-700 border border-blue-200' },
  docx: { label: 'DOCX', toneClassName: 'bg-blue-100 text-blue-700 border border-blue-200' },
  ppt: { label: 'PPT', toneClassName: 'bg-orange-100 text-orange-700 border border-orange-200' },
  pptx: { label: 'PPTX', toneClassName: 'bg-orange-100 text-orange-700 border border-orange-200' },
  xls: { label: 'XLS', toneClassName: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  xlsx: {
    label: 'XLSX',
    toneClassName: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  csv: { label: 'CSV', toneClassName: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  zip: { label: 'ZIP', toneClassName: 'bg-violet-100 text-violet-700 border border-violet-200' },
  txt: { label: 'TXT', toneClassName: 'bg-slate-100 text-slate-700 border border-slate-200' },
  json: { label: 'JSON', toneClassName: 'bg-amber-100 text-amber-700 border border-amber-200' },
  png: { label: 'PNG', toneClassName: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
  jpg: { label: 'JPG', toneClassName: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
  jpeg: { label: 'JPEG', toneClassName: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
  webp: { label: 'WEBP', toneClassName: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
  gif: { label: 'GIF', toneClassName: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
};

const MIME_TO_EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function extensionFromFileName(fileName: string): string | null {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === fileName.length - 1) {
    return null;
  }
  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function getFileTypeDisplay(
  fileType: string | null | undefined,
  fileName: string,
): FileTypeDisplay {
  const normalizedMime = (fileType ?? '').trim().toLowerCase();
  const byMime = MIME_TO_EXTENSION[normalizedMime];
  const byFileName = extensionFromFileName(fileName);
  const key = byMime ?? byFileName ?? null;

  if (key && FILE_TYPE_CONFIG[key]) {
    return FILE_TYPE_CONFIG[key];
  }

  return {
    label: key ? key.toUpperCase() : 'FILE',
    toneClassName: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
}
