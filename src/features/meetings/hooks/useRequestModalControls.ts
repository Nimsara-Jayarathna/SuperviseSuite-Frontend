import { useCallback, useState } from 'react';
import type { ApiError } from '@/types';
import type { RequestModalState } from './requestModal';

export type RequestModalControls = {
  requestModal: RequestModalState;
  closeRequestModal: () => void;
  openLoadingModal: (title: string, message: string) => void;
  openSuccessModal: (title: string, message: string) => void;
  openErrorModal: (title: string, apiError: ApiError, retryAction: () => void) => void;
};

const INITIAL_REQUEST_MODAL: RequestModalState = {
  isOpen: false,
  status: 'loading',
  title: '',
  message: '',
  retryAction: null,
};

export function useRequestModalControls(): RequestModalControls {
  const [requestModal, setRequestModal] = useState<RequestModalState>(INITIAL_REQUEST_MODAL);

  const closeRequestModal = useCallback(() => {
    setRequestModal((current) => ({ ...current, isOpen: false, retryAction: null }));
  }, []);

  const openLoadingModal = useCallback((title: string, message: string) => {
    setRequestModal({ isOpen: true, status: 'loading', title, message, retryAction: null });
  }, []);

  const openSuccessModal = useCallback((title: string, message: string) => {
    setRequestModal({ isOpen: true, status: 'success', title, message, retryAction: null });
  }, []);

  const openErrorModal = useCallback(
    (title: string, apiError: ApiError, retryAction: () => void) => {
      setRequestModal({
        isOpen: true,
        status: 'error',
        title,
        message: apiError.message,
        retryAction,
      });
    },
    [],
  );

  return {
    requestModal,
    closeRequestModal,
    openLoadingModal,
    openSuccessModal,
    openErrorModal,
  };
}
