import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiException } from '@/services/apiClient';
import { tokenStorage } from '@/services/tokenStorage';
import type { ApiError } from '@/types';
import { authApi } from '../api/authApi';
import type { AuthUser, LoginResponse, LoginRequest } from '../types';
import { ROLE_HOME } from '@/app/routes/roleHome';

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  error: ApiError | null;
};

export function useAuth() {
  const navigate = useNavigate();

  // Rehydrate user from localStorage so auth state survives page reloads.
  const [state, setState] = useState<AuthState>({
    user: tokenStorage.getUser() as AuthUser | null,
    isLoading: false,
    error: null,
  });

  const setLoading = () => setState((s) => ({ ...s, isLoading: true, error: null }));
  const setError = (error: ApiError) => setState((s) => ({ ...s, isLoading: false, error }));
  const setUser = (user: AuthUser) => setState({ user, isLoading: false, error: null });

  // Generic fallback for unexpected errors (e.g. network timeout).
  // Without this, isLoading would stay true indefinitely.
  const setUnexpectedError = () =>
    setState((s) => ({
      ...s,
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
    }));

  async function login(body: LoginRequest): Promise<void> {
    setLoading();
    try {
      const res: LoginResponse = await authApi.login(body);
      tokenStorage.setUser(res.user);
      setUser(res.user);
      navigate(ROLE_HOME[res.user.role] ?? '/');
    } catch (err) {
      if (isApiException(err)) {
        setError(err.apiError);
      } else {
        setUnexpectedError();
      }
      throw err;
    }
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      // Swallow errors — even if the server call fails the browser will have
      // cleared the cookies (Max-Age=0) and we still wipe local state.
    }
    tokenStorage.clearAll();
    setState({ user: null, isLoading: false, error: null });
    navigate('/');
  }

  function clearError(): void {
    setState((s) => ({ ...s, error: null }));
  }

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    clearError,
  };
}
