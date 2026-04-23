import { useRef, useState } from 'react';
import type {
  ConfirmUploadRequest,
  ProjectFile,
  UploadUrlRequest,
  UploadUrlResponse,
} from '../types';
import {
  baseNameFromFileName,
  enforceExpectedExtension,
  normalizeFileNameDraft,
  resolveExpectedExtension,
  resolveUploadContentType,
  uploadFileToPresignedUrl,
  validateSelectedFile,
} from '../lib/uploadFileUtils';

type RequestModalState = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
};

type UseUploadFileModalStateParams = {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (uploadedFile: ProjectFile) => Promise<void> | void;
  getUploadUrl: (payload: UploadUrlRequest) => Promise<UploadUrlResponse>;
  confirmUpload: (payload: ConfirmUploadRequest) => Promise<ProjectFile>;
  maxFileSizeBytes: number;
  maxFileNameLength: number;
  allowedTypesSet: Set<string>;
};

export function useUploadFileModalState({
  isOpen,
  onClose,
  onUploaded,
  getUploadUrl,
  confirmUpload,
  maxFileSizeBytes,
  maxFileNameLength,
  allowedTypesSet,
}: UseUploadFileModalStateParams) {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileNameDraft, setFileNameDraft] = useState('');
  const [expectedExtension, setExpectedExtension] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);
  const [requestModal, setRequestModal] = useState<RequestModalState>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });

  function resetModalState() {
    setSelectedFile(null);
    setFileNameDraft('');
    setExpectedExtension(null);
    setError(null);
    setIsSubmitting(false);
    setIsDragActive(false);
    setHasSubmitAttempted(false);
  }

  function handleClose() {
    if (!isOpen || isSubmitting) {
      return;
    }
    resetModalState();
    onClose();
  }

  function applySelectedFile(file: File | null) {
    if (!isOpen) return;
    if (!file) {
      return;
    }

    const validationError = validateSelectedFile(file, maxFileSizeBytes, allowedTypesSet);
    if (validationError) {
      setSelectedFile(null);
      setFileNameDraft('');
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    const resolvedExpectedExtension = resolveExpectedExtension(file, allowedTypesSet);
    setExpectedExtension(resolvedExpectedExtension);

    const maxBaseNameLength =
      resolvedExpectedExtension !== null
        ? Math.max(0, maxFileNameLength - (resolvedExpectedExtension.length + 1))
        : maxFileNameLength;
    setFileNameDraft(normalizeFileNameDraft(baseNameFromFileName(file.name), maxBaseNameLength));
    setError(null);
  }

  async function handleUpload() {
    if (!isOpen) return;
    setHasSubmitAttempted(true);

    if (!selectedFile) {
      setError('Select a file to continue.');
      return;
    }

    const validationError = validateSelectedFile(selectedFile, maxFileSizeBytes, allowedTypesSet);
    if (validationError) {
      setError(validationError);
      return;
    }

    const baseDraft = fileNameDraft.trim();
    const finalFileName =
      expectedExtension !== null
        ? enforceExpectedExtension(baseDraft, expectedExtension, maxFileNameLength)
        : baseDraft;
    if (finalFileName.length === 0) {
      setError('File name is required.');
      return;
    }
    if (finalFileName.length > maxFileNameLength) {
      setError(`File name cannot exceed ${maxFileNameLength} characters.`);
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

      await uploadFileToPresignedUrl(uploadMeta.presignedUrl, selectedFile, contentType);

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

  function onDragOver(event: React.DragEvent) {
    event.preventDefault();
    if (!isOpen || isSubmitting) {
      return;
    }
    setIsDragActive(true);
  }

  function onDragLeave(event: React.DragEvent) {
    event.preventDefault();
    if (!isOpen) return;
    setIsDragActive(false);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    if (!isOpen) return;
    setIsDragActive(false);
    if (isSubmitting) {
      return;
    }
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    applySelectedFile(droppedFile);
  }

  function onFileNameDraftChange(nextValue: string) {
    const maxBaseNameLength =
      expectedExtension !== null
        ? Math.max(0, maxFileNameLength - (expectedExtension.length + 1))
        : maxFileNameLength;
    setFileNameDraft(normalizeFileNameDraft(nextValue, maxBaseNameLength));
  }

  function onFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    applySelectedFile(file);
  }

  function closeRequestModal() {
    setRequestModal((current) => ({ ...current, isOpen: false }));
  }

  function closeSuccessModalAndExit() {
    closeRequestModal();
    resetModalState();
    onClose();
  }

  return {
    hiddenInputRef,
    selectedFile,
    fileNameDraft,
    expectedExtension,
    error,
    isSubmitting,
    isDragActive,
    hasSubmitAttempted,
    requestModal,
    setHasSubmitAttempted,
    applySelectedFile,
    handleUpload,
    handleClose,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileNameDraftChange,
    onFileInputChange,
    closeRequestModal,
    closeSuccessModalAndExit,
    resetModalState,
  };
}
