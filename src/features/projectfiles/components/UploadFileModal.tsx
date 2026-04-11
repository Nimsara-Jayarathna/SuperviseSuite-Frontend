import { useRef, useState } from 'react';
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

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES_TEXT = 'PDF, DOCX, PPTX, ZIP • Max 10MB';
const ACCEPTED_INPUT_VALUE = '.pdf,.docx,.pptx,.zip';
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
]);
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'pptx', 'zip']);
const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

function extensionFromFileName(fileName: string): string | null {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return null;
  }
  return fileName.slice(dotIndex + 1).toLowerCase();
}

function validateSelectedFile(file: File): string | null {
  if (file.size <= 0) {
    return 'Selected file is empty.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File size must be 10 MB or less.';
  }

  const extension = extensionFromFileName(file.name);
  const type = file.type.trim().toLowerCase();
  const mimeValid = type.length > 0 && ALLOWED_MIME_TYPES.has(type);
  const extensionValid = extension !== null && ALLOWED_EXTENSIONS.has(extension);

  if (!mimeValid && !extensionValid) {
    return 'Only PDF, DOCX, PPTX, and ZIP files are allowed.';
  }

  return null;
}

function resolveUploadContentType(file: File): string {
  const mimeType = file.type.trim().toLowerCase();
  if (mimeType.length > 0 && ALLOWED_MIME_TYPES.has(mimeType)) {
    return mimeType;
  }

  const extension = extensionFromFileName(file.name);
  if (extension && EXTENSION_TO_MIME[extension]) {
    return EXTENSION_TO_MIME[extension];
  }

  return mimeType;
}

function uploadFileWithProgress(
  presignedUrl: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }
      const raw = Math.round((event.loaded / event.total) * 100);
      const clamped = Math.max(0, Math.min(100, raw));
      onProgress(clamped);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(new Error('Upload to storage failed.'));
    };

    xhr.onerror = () => {
      reject(new Error('Upload to storage failed.'));
    };

    xhr.send(file);
  });
}

export function UploadFileModal({
  isOpen,
  title = 'Upload file',
  onClose,
  onUploaded,
  getUploadUrl,
  confirmUpload,
}: UploadFileModalProps) {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileNameDraft, setFileNameDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);

  if (!isOpen) {
    return null;
  }

  function resetModalState() {
    setSelectedFile(null);
    setFileNameDraft('');
    setError(null);
    setIsSubmitting(false);
    setUploadProgress(0);
    setIsDragActive(false);
    setHasSubmitAttempted(false);
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }
    resetModalState();
    onClose();
  }

  function applySelectedFile(file: File | null) {
    if (!file) {
      return;
    }

    const validationError = validateSelectedFile(file);
    if (validationError) {
      setSelectedFile(null);
      setFileNameDraft('');
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setFileNameDraft(file.name);
    setError(null);
  }

  async function handleUpload() {
    setHasSubmitAttempted(true);

    if (!selectedFile) {
      setError('Select a file to continue.');
      return;
    }

    const validationError = validateSelectedFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    const finalFileName = fileNameDraft.trim();
    if (finalFileName.length === 0) {
      setError('File name is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setUploadProgress(5);

    try {
      const contentType = resolveUploadContentType(selectedFile);
      const uploadMeta = await getUploadUrl({
        fileName: finalFileName,
        contentType,
      });

      setUploadProgress(10);
      await uploadFileWithProgress(uploadMeta.presignedUrl, selectedFile, contentType, setUploadProgress);

      await confirmUpload({
        s3Key: uploadMeta.s3Key,
        fileName: finalFileName,
        fileType: contentType,
        fileSize: selectedFile.size,
      });

      await onUploaded();
      resetModalState();
      onClose();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload file.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/25 bg-white p-6 shadow-[0_28px_72px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">{ACCEPTED_FILE_TYPES_TEXT}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Close
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (isSubmitting) {
                return;
              }
              setIsDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragActive(false);
              if (isSubmitting) {
                return;
              }
              const droppedFile = event.dataTransfer.files?.[0] ?? null;
              applySelectedFile(droppedFile);
            }}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragActive ? 'border-slate-500 bg-slate-50' : 'border-slate-300 bg-slate-50/40'
            }`}
          >
            <p className="text-sm font-semibold text-slate-700">Drag and drop a file here</p>
            <p className="mt-1 text-xs text-slate-500">or browse from your device</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => hiddenInputRef.current?.click()}
              disabled={isSubmitting}
            >
              Choose file
            </Button>
            <input
              ref={hiddenInputRef}
              type="file"
              accept={ACCEPTED_INPUT_VALUE}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                applySelectedFile(file);
              }}
              className="hidden"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              File name
            </label>
            <input
              type="text"
              value={fileNameDraft}
              onChange={(event) => setFileNameDraft(event.target.value)}
              disabled={!selectedFile || isSubmitting}
              placeholder="Select a file first"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
            />
          </div>

          {selectedFile ? (
            <p className="text-xs text-slate-500">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          ) : null}

          {isSubmitting ? (
            <div className="space-y-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-[width] duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">Uploading to storage... {uploadProgress}%</p>
            </div>
          ) : null}

          {error ? <p className="text-xs text-rose-700">{error}</p> : null}
          {!error && hasSubmitAttempted && !selectedFile ? (
            <p className="text-xs text-rose-700">Select a file to continue.</p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={() => void handleUpload()} disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
