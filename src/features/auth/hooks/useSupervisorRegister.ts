import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { authApi } from '../api/authApi';
import type { SupervisorRegisterRequest } from '../types';

type RegisterState = {
  isLoading: boolean;
  isSuccess: boolean;
  error: ApiError | null;
};

const SUCCESS_REDIRECT_DELAY_MS = 1200;

export function useSupervisorRegister() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef<number | null>(null);

  const [state, setState] = useState<RegisterState>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  const setLoading = () => setState({ isLoading: true, isSuccess: false, error: null });
  const setError = (error: ApiError) => setState({ isLoading: false, isSuccess: false, error });

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  function clearError(): void {
    setState((s) => ({ ...s, error: null }));
  }

  function setUnexpectedError(): void {
    setState({
      isLoading: false,
      isSuccess: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again.',
        details: [],
        timestamp: new Date().toISOString(),
        status: 0,
        error: 'Unexpected Error',
        path: '',
        traceId: null,
      } satisfies ApiError,
    });
  }

  async function register(body: SupervisorRegisterRequest): Promise<void> {
    setLoading();
    try {
      await authApi.registerSupervisor(body);
      setState({ isLoading: false, isSuccess: true, error: null });
      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/login');
      }, SUCCESS_REDIRECT_DELAY_MS);
    } catch (err) {
      if (isApiException(err)) setError(err.apiError);
      else setUnexpectedError();
    }
  }

  return {
    register,
    isLoading: state.isLoading,
    isSuccess: state.isSuccess,
    error: state.error,
    clearError,
  };
}
