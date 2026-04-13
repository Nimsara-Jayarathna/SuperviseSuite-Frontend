import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { Button } from '@/components/ui/Button';
import { AlertCircle, X } from 'lucide-react';
import type {
  ConfirmUploadRequest,
  ProjectFile,
  UploadUrlRequest,
  UploadUrlResponse,
} from '../types';

type UploadFileModalProps = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  onUploaded: (uploadedFile: ProjectFile) => Promise<void> | void;
  getUploadUrl: (payload: UploadUrlRequest) => Promise<UploadUrlResponse>;
  confirmUpload: (payload: ConfirmUploadRequest) => Promise<ProjectFile>;
  maxFileSizeBytes?: number;
  maxFileNameLength?: number;
  allowedTypes?: string[];
};

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_ALLOWED_TYPES = ['pdf', 'docx', 'pptx', 'zip'];
const DEFAULT_MAX_FILE_NAME_LENGTH = 50;
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

function bytesToHumanSize(bytes: number): string {
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

function normalizeAllowedTypes(allowedTypes?: string[]): string[] {
  const source = allowedTypes && allowedTypes.length > 0 ? allowedTypes : DEFAULT_ALLOWED_TYPES;
  return source.map((type) => type.trim().toLowerCase()).filter((type) => type.length > 0);
}

function validateSelectedFile(
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

function resolveUploadContentType(file: File): string {
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

async function uploadFile(presignedUrl: string, file: File, contentType: string): Promise<void> {
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

function normalizeFileNameDraft(value: string, maxFileNameLength: number): string {
  return value.slice(0, maxFileNameLength);
}

export function UploadFileModal({
  isOpen,
  title = 'Upload file',
  onClose,
  onUploaded,
  getUploadUrl,
  confirmUpload,
  maxFileSizeBytes,
  maxFileNameLength,
  allowedTypes,
}: UploadFileModalProps) {
  const resolvedMaxFileSizeBytes = Math.max(1, maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES);
  const resolvedMaxFileNameLength = Math.max(1, maxFileNameLength ?? DEFAULT_MAX_FILE_NAME_LENGTH);
  const resolvedAllowedTypes = normalizeAllowedTypes(allowedTypes);
  const allowedTypesSet = new Set(resolvedAllowedTypes);
  const acceptedInputValue = resolvedAllowedTypes.map((type) => `.${type}`).join(',');
  const acceptedFileTypesText = `${resolvedAllowedTypes.map((type) => type.toUpperCase()).join(', ')} • Max ${bytesToHumanSize(resolvedMaxFileSizeBytes)}`;

  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileNameDraft, setFileNameDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);
  const [requestModal, setRequestModal] = useState<{
    isOpen: boolean;
    status: 'loading' | 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });
  const isUploadDisabled = isSubmitting || !selectedFile || fileNameDraft.trim().length === 0;
  const inlineMessage =
    error ?? (hasSubmitAttempted && !selectedFile ? 'Select a file to continue.' : null);

  if (!isOpen) {
    return null;
  }

  function resetModalState() {
    setSelectedFile(null);
    setFileNameDraft('');
    setError(null);
    setIsSubmitting(false);
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

    const validationError = validateSelectedFile(file, resolvedMaxFileSizeBytes, allowedTypesSet);
    if (validationError) {
      setSelectedFile(null);
      setFileNameDraft('');
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setFileNameDraft(normalizeFileNameDraft(file.name, resolvedMaxFileNameLength));
    setError(null);
  }

  async function handleUpload() {
    setHasSubmitAttempted(true);

    if (!selectedFile) {
      setError('Select a file to continue.');
      return;
    }

    const validationError = validateSelectedFile(
      selectedFile,
      resolvedMaxFileSizeBytes,
      allowedTypesSet,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    const finalFileName = fileNameDraft.trim();
    if (finalFileName.length === 0) {
      setError('File name is required.');
      return;
    }
    if (finalFileName.length > resolvedMaxFileNameLength) {
      setError(`File name cannot exceed ${resolvedMaxFileNameLength} characters.`);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Uploading file',
      message: 'Uploading to storage and saving file metadata.',
    });

    try {
      const contentType = resolveUploadContentType(selectedFile);
      const uploadMeta = await getUploadUrl({
        fileName: finalFileName,
        contentType,
      });

      await uploadFile(uploadMeta.presignedUrl, selectedFile, contentType);

      const uploadedFile = await confirmUpload({
        s3Key: uploadMeta.s3Key,
        fileName: finalFileName,
        fileType: contentType,
        fileSize: selectedFile.size,
      });

      await onUploaded(uploadedFile);
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: 'Upload complete',
        message: 'File uploaded successfully.',
      });
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Unable to upload file.';
      setError(message);
      setRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Upload failed',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        role="dialog"
        aria-modal
      >
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={handleClose} />
        <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/25 bg-white p-6 shadow-[0_28px_72px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs font-medium text-slate-500">{acceptedFileTypesText}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
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
              <p className="text-sm font-semibold text-slate-700">
                {selectedFile ? 'File selected' : 'Drag and drop a file here'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedFile
                  ? 'You can choose a different file anytime'
                  : 'or browse from your device'}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => hiddenInputRef.current?.click()}
                disabled={isSubmitting}
              >
                {selectedFile ? 'Select different file' : 'Choose file'}
              </Button>
              <input
                ref={hiddenInputRef}
                type="file"
                accept={acceptedInputValue}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  applySelectedFile(file);
                }}
                className="hidden"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  File name
                </label>
                <span className="text-[11px] text-slate-500">
                  {fileNameDraft.length}/{resolvedMaxFileNameLength}
                </span>
              </div>
              <input
                type="text"
                value={fileNameDraft}
                onChange={(event) =>
                  setFileNameDraft(
                    normalizeFileNameDraft(event.target.value, resolvedMaxFileNameLength),
                  )
                }
                maxLength={resolvedMaxFileNameLength}
                disabled={!selectedFile || isSubmitting}
                placeholder="Select a file first"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
              />
            </div>

            {selectedFile ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="shrink-0 font-medium">Selected:</span>
                  <span className="min-w-0 flex-1 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <span className="shrink-0">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </p>
              </div>
            ) : null}

            {inlineMessage ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="flex items-start gap-2 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{inlineMessage}</span>
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleUpload()}
              disabled={isUploadDisabled}
            >
              Upload
            </Button>
          </div>
        </div>
      </div>

      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        autoCloseOnSuccess
        onClose={
          requestModal.status === 'success'
            ? () => {
                setRequestModal((current) => ({ ...current, isOpen: false }));
                resetModalState();
                onClose();
              }
            : () => setRequestModal((current) => ({ ...current, isOpen: false }))
        }
      />
    </>,
    document.body,
  );
}
