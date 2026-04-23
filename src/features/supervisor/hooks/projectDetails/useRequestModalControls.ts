import { useState } from 'react';
import type { RequestModalState } from '../../projectDetails.shared';

export type RequestModalControls = {
  state: RequestModalState;
  close: () => void;
  retryLastRequest: () => void;
  showLoading: (title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string, retryAction: () => Promise<void>) => void;
  showValidationError: (title: string, message: string) => void;
};

export function useRequestModalControls(): RequestModalControls {
  const [requestModal, setRequestModal] = useState<RequestModalState>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
    retryAction: null,
  });

  function close() {
    setRequestModal((current) => ({ ...current, isOpen: false, retryAction: null }));
  }

  function showLoading(title: string, message: string) {
    setRequestModal({ isOpen: true, status: 'loading', title, message, retryAction: null });
  }

  function showSuccess(title: string, message: string) {
    setRequestModal({ isOpen: true, status: 'success', title, message, retryAction: null });
  }

  function showError(title: string, message: string, retryAction: () => Promise<void>) {
    setRequestModal({ isOpen: true, status: 'error', title, message, retryAction });
  }

  function showValidationError(title: string, message: string) {
    setRequestModal({ isOpen: true, status: 'error', title, message, retryAction: null });
  }

  function retryLastRequest() {
    if (requestModal.retryAction) void requestModal.retryAction();
  }

  return {
    state: requestModal,
    close,
    retryLastRequest,
    showLoading,
    showSuccess,
    showError,
    showValidationError,
  };
}
