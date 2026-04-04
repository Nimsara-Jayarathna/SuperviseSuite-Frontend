import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { authApi } from '../api/authApi';
import type { SupervisorRegisterRequest } from '../types';

type RegisterState = {
  isLoading: boolean;
  error: ApiError | null;
};

export function useSupervisorRegister() {
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

  async function register(body: SupervisorRegisterRequest): Promise<void> {
    setLoading();
    try {
      await authApi.registerSupervisor(body);
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
