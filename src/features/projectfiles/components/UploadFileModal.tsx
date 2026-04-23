import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { Button } from '@/components/ui/Button';
import { AlertCircle, X } from 'lucide-react';
import {
  bytesToHumanSize,
  normalizeAllowedTypes,
  resolveExpectedExtension,
} from '../lib/uploadFileUtils';
import type {
  ConfirmUploadRequest,
  ProjectFile,
  UploadUrlRequest,
  UploadUrlResponse,
} from '../types';
import { useUploadFileModalState } from '../hooks/useUploadFileModalState';

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
const DEFAULT_MAX_FILE_NAME_LENGTH = 50;

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
  const allowedTypesSet = useMemo(() => new Set(resolvedAllowedTypes), [resolvedAllowedTypes]);
  const acceptedInputValue = resolvedAllowedTypes.map((type) => `.${type}`).join(',');
  const acceptedFileTypesText = `${resolvedAllowedTypes.map((type) => type.toUpperCase()).join(', ')} • Max ${bytesToHumanSize(resolvedMaxFileSizeBytes)}`;
  const state = useUploadFileModalState({
    isOpen,
    onClose,
    onUploaded,
    getUploadUrl,
    confirmUpload,
    maxFileSizeBytes: resolvedMaxFileSizeBytes,
    maxFileNameLength: resolvedMaxFileNameLength,
    allowedTypesSet,
  });
  const uiExpectedExtension = useMemo(() => {
    if (!state.selectedFile) return null;
    return resolveExpectedExtension(state.selectedFile, allowedTypesSet);
  }, [allowedTypesSet, state.selectedFile]);
  const maxNameInputLength = uiExpectedExtension
    ? Math.max(0, resolvedMaxFileNameLength - (uiExpectedExtension.length + 1))
    : resolvedMaxFileNameLength;

  const isUploadDisabled =
    state.isSubmitting || !state.selectedFile || state.fileNameDraft.trim().length === 0;
  const inlineMessage =
    state.error ??
    (state.hasSubmitAttempted && !state.selectedFile ? 'Select a file to continue.' : null);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        role="dialog"
        aria-modal
      >
        <div
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          onClick={state.handleClose}
        />
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
              onClick={state.handleClose}
              disabled={state.isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            <div
              onDragOver={state.onDragOver}
              onDragLeave={state.onDragLeave}
              onDrop={state.onDrop}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                state.isDragActive
                  ? 'border-slate-500 bg-slate-50'
                  : 'border-slate-300 bg-slate-50/40'
              }`}
            >
              <p className="text-sm font-semibold text-slate-700">
                {state.selectedFile ? 'File selected' : 'Drag and drop a file here'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {state.selectedFile
                  ? 'You can choose a different file anytime'
                  : 'or browse from your device'}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => state.hiddenInputRef.current?.click()}
                disabled={state.isSubmitting}
              >
                {state.selectedFile ? 'Select different file' : 'Choose file'}
              </Button>
              <input
                ref={state.hiddenInputRef}
                type="file"
                accept={acceptedInputValue}
                onChange={state.onFileInputChange}
                className="hidden"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  File name
                </label>
                <span className="text-[11px] text-slate-500">
                  {state.fileNameDraft.length}/{maxNameInputLength}
                </span>
              </div>
              <input
                type="text"
                value={state.fileNameDraft}
                onChange={(event) => state.onFileNameDraftChange(event.target.value)}
                maxLength={maxNameInputLength}
                disabled={!state.selectedFile || state.isSubmitting}
                placeholder="Select a file first"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
              />
            </div>

            {state.selectedFile ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="shrink-0 font-medium">Selected:</span>
                  <span className="min-w-0 flex-1 truncate" title={state.selectedFile.name}>
                    {state.selectedFile.name}
                  </span>
                  <span className="shrink-0">
                    ({(state.selectedFile.size / 1024 / 1024).toFixed(2)} MB)
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
              onClick={() => void state.handleUpload()}
              disabled={isUploadDisabled}
            >
              Upload
            </Button>
          </div>
        </div>
      </div>

      <RequestStateModal
        isOpen={state.requestModal.isOpen}
        status={state.requestModal.status}
        title={state.requestModal.title}
        message={state.requestModal.message}
        autoCloseOnSuccess
        onClose={
          state.requestModal.status === 'success'
            ? state.closeSuccessModalAndExit
            : state.closeRequestModal
        }
      />
    </>,
    document.body,
  );
}
