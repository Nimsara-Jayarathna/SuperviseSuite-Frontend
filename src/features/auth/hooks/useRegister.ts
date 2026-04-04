import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { authApi } from '../api/authApi';
import type { RegisterRequest } from '../types';

type RegisterState = {
  isLoading: boolean;
  isSuccess: boolean;
  error: ApiError | null;
};

const SUCCESS_REDIRECT_DELAY_MS = 1200;

/**
 * Narrow hook that owns only the student registration concern.
 *
 * Interface Segregation: consumers of this hook are not burdened with
 * login, logout, or user-session state from the broader {@code useAuth} hook.
 *
 * Single Responsibility: this hook does one thing — submit a registration
 * request and navigate to /login on success.
 */
export function useRegister() {
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

  async function register(body: RegisterRequest): Promise<void> {
    setLoading();
    try {
      await authApi.register(body);
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
