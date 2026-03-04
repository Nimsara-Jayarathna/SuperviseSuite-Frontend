import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { authApi } from '../api/authApi';
import type { RegisterRequest } from '../types';

type RegisterState = {
  isLoading: boolean;
  error: ApiError | null;
};

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

  const [state, setState] = useState<RegisterState>({ isLoading: false, error: null });

  const setLoading = () => setState({ isLoading: true, error: null });
  const setError = (error: ApiError) => setState({ isLoading: false, error });

  function clearError(): void {
    setState((s) => ({ ...s, error: null }));
  }

  function setUnexpectedError(): void {
    setState({
      isLoading: false,
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
      // Registration only creates the account — the student must sign in separately.
      setState({ isLoading: false, error: null });
      navigate('/login');
    } catch (err) {
      if (isApiException(err)) setError(err.apiError);
      else setUnexpectedError();
    }
  }

  return {
    register,
    isLoading: state.isLoading,
    error: state.error,
    clearError,
  };
}
