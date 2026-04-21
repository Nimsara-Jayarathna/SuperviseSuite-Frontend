import { useCallback, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';

export type ProjectDetailsRefreshRequestModalState = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
  retryAction?: () => void;
  redirectToJiraOnClose?: boolean;
};

type UseProjectDetailsRefreshRequestModalParams = {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
};

export function useProjectDetailsRefreshRequestModal({
  searchParams,
  setSearchParams,
}: UseProjectDetailsRefreshRequestModalParams) {
  const [state, setState] = useState<ProjectDetailsRefreshRequestModalState>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });

  const showLoading = useCallback(
    (payload: { title: string; message: string; retryAction?: () => void }) => {
      setState({
        isOpen: true,
        status: 'loading',
        title: payload.title,
        message: payload.message,
        retryAction: payload.retryAction,
        redirectToJiraOnClose: false,
      });
    },
    [],
  );

  const showError = useCallback(
    (payload: { title: string; message: string; retryAction?: () => void }) => {
      setState({
        isOpen: true,
        status: 'error',
        title: payload.title,
        message: payload.message,
        retryAction: payload.retryAction,
        redirectToJiraOnClose: false,
      });
    },
    [],
  );

  const showSuccess = useCallback(
    (payload: { title: string; message: string; redirectToJiraOnClose?: boolean }) => {
      setState({
        isOpen: true,
        status: 'success',
        title: payload.title,
        message: payload.message,
        redirectToJiraOnClose: payload.redirectToJiraOnClose,
      });
    },
    [],
  );

  const hide = useCallback(() => {
    setState((current) => ({ ...current, isOpen: false, redirectToJiraOnClose: false }));
  }, []);

  const close = useCallback(() => {
    setState((current) => {
      if (current.redirectToJiraOnClose) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', 'jira');
        setSearchParams(nextParams, { replace: true });
      }

      return { ...current, isOpen: false, redirectToJiraOnClose: false };
    });
  }, [searchParams, setSearchParams]);

  return {
    state,
    showLoading,
    showError,
    showSuccess,
    hide,
    close,
  };
}
