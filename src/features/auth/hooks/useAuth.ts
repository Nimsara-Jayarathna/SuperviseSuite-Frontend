import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiException } from '@/services/apiClient';
import { tokenStorage } from '@/services/tokenStorage';
import type { ApiError } from '@/types';
import { authApi } from '../api/authApi';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types';

/** Route to redirect to after a successful login/register, keyed by role */
const ROLE_HOME: Record<string, string> = {
  SUPERVISOR: '/supervisor/dashboard',
  STUDENT: '/student/projects',
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  error: ApiError | null;
};

export function useAuth() {
  const navigate = useNavigate();

  // Rehydrate user from storage so auth state survives page reloads
  const [state, setState] = useState<AuthState>({
    user: tokenStorage.getUser() as AuthUser | null,
    isLoading: false,
    error: null,
  });

  const setLoading = () => setState((s) => ({ ...s, isLoading: true, error: null }));
  const setError = (error: ApiError) => setState((s) => ({ ...s, isLoading: false, error }));
  const setUser = (user: AuthUser) => setState({ user, isLoading: false, error: null });

  async function login(body: LoginRequest): Promise<void> {
    setLoading();
    try {
      const res = await authApi.login(body);
      tokenStorage.setAccessToken(res.accessToken);
      tokenStorage.setRefreshToken(res.refreshToken);
      tokenStorage.setUser(res.user);
      setUser(res.user);
      navigate(ROLE_HOME[res.user.role] ?? '/');
    } catch (err) {
      if (isApiException(err)) setError(err.apiError);
    }
  }

  async function register(body: RegisterRequest): Promise<void> {
    setLoading();
    try {
      const res = await authApi.register(body);
      tokenStorage.setAccessToken(res.accessToken);
      tokenStorage.setRefreshToken(res.refreshToken);
      tokenStorage.setUser(res.user);
      setUser(res.user);
      navigate(ROLE_HOME[res.user.role] ?? '/');
    } catch (err) {
      if (isApiException(err)) setError(err.apiError);
    }
  }

  function logout(): void {
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
    register,
    logout,
    clearError,
  };
}
