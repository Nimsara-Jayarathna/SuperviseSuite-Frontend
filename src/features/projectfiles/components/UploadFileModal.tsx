import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import type { ConfirmUploadRequest, UploadUrlRequest, UploadUrlResponse } from '../types';

type UploadFileModalProps = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  onUploaded: () => Promise<void> | void;
  getUploadUrl: (payload: UploadUrlRequest) => Promise<UploadUrlResponse>;
  confirmUpload: (payload: ConfirmUploadRequest) => Promise<unknown>;
};

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

function validateFile(file: File | null): string | null {
  if (!file) {
    return 'Select a file to continue.';
  }
  if (file.size <= 0) {
    return 'Selected file is empty.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File size must be 100 MB or less.';
  }
  if (!file.type || !ALLOWED_MIME_TYPES.has(file.type)) {
    return 'This file type is not supported.';
  }
  return null;
}

export function UploadFileModal({
  isOpen,
  title = 'Upload file',
  onClose,
  onUploaded,
  getUploadUrl,
  confirmUpload,
}: UploadFileModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileValidationError = useMemo(() => validateFile(selectedFile), [selectedFile]);

  if (!isOpen) {
    return null;
  }

  async function handleUpload() {
    const validationError = validateFile(selectedFile);
    if (!selectedFile || validationError) {
      setError(validationError ?? 'Invalid file.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const contentType = selectedFile.type || 'application/octet-stream';
      const uploadMeta = await getUploadUrl({
        fileName: selectedFile.name,
        contentType,
      });

      const putResponse = await fetch(uploadMeta.presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: selectedFile,
      });

      if (!putResponse.ok) {
        throw new Error('Upload to storage failed.');
      }

      await confirmUpload({
        s3Key: uploadMeta.s3Key,
        fileName: selectedFile.name,
        fileType: contentType,
        fileSize: selectedFile.size,
      });

      await onUploaded();
      setSelectedFile(null);
      onClose();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload file.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/25 bg-white p-6 shadow-[0_28px_72px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">Supported files up to 100 MB.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            Select file
          </label>
          <input
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setError(null);
            }}
            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          {selectedFile ? (
            <p className="text-xs text-slate-500">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          ) : null}
          {fileValidationError ? <p className="text-xs text-rose-700">{fileValidationError}</p> : null}
          {error ? <p className="text-xs text-rose-700">{error}</p> : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleUpload()}
            disabled={isSubmitting || Boolean(fileValidationError)}
          >
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
