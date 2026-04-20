const DEFAULT_ALLOWED_TYPES = ['pdf', 'docx', 'pptx', 'zip'];

const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

export function extensionFromFileName(fileName: string): string | null {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return null;
  }
  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function bytesToHumanSize(bytes: number): string {
  if (bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${Number.isInteger(mb) ? mb.toFixed(0) : mb.toFixed(1)}MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(1)}GB`;
}

export function normalizeAllowedTypes(allowedTypes?: string[]): string[] {
  const source = allowedTypes && allowedTypes.length > 0 ? allowedTypes : DEFAULT_ALLOWED_TYPES;
  return source.map((type) => type.trim().toLowerCase()).filter((type) => type.length > 0);
}

export function validateSelectedFile(
  file: File,
  maxFileSizeBytes: number,
  allowedTypes: Set<string>,
): string | null {
  if (file.size <= 0) {
    return 'Selected file is empty.';
  }
  if (file.size > maxFileSizeBytes) {
    return `File size must be ${bytesToHumanSize(maxFileSizeBytes)} or less.`;
  }

  const extension = extensionFromFileName(file.name);
  const type = file.type.trim().toLowerCase();
  const mimeExtension =
    Object.entries(EXTENSION_TO_MIME).find(([, mime]) => mime === type)?.[0] ?? null;
  const mimeValid = mimeExtension !== null && allowedTypes.has(mimeExtension);
  const extensionValid = extension !== null && allowedTypes.has(extension);

  if (!mimeValid && !extensionValid) {
    return `Only ${Array.from(allowedTypes)
      .map((fileType) => fileType.toUpperCase())
      .join(', ')} files are allowed.`;
  }

  return null;
}

export function resolveUploadContentType(file: File): string {
  const mimeType = file.type.trim().toLowerCase();
  if (mimeType.length > 0) {
    return mimeType;
  }

  const extension = extensionFromFileName(file.name);
  if (extension && EXTENSION_TO_MIME[extension]) {
    return EXTENSION_TO_MIME[extension];
  }

  return mimeType;
}

export async function uploadFileToPresignedUrl(
  presignedUrl: string,
  file: File,
  contentType: string,
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Upload to storage failed.');
  }
}

export function normalizeFileNameDraft(value: string, maxFileNameLength: number): string {
  return value.slice(0, maxFileNameLength);
}
