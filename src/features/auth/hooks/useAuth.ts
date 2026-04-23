import { useNavigate } from 'react-router-dom';
import { isApiException } from '@/services/apiClient';
import { tokenStorage } from '@/services/tokenStorage';
import {
  beginSessionTransition,
  isCurrentSession,
  resetSessionState,
} from '@/services/sessionState';
import type { ApiError } from '@/types';
import { ROLE_HOME } from '@/app/routes/roleHome';
import { authApi } from '../api/authApi';
import type { AuthUser, LoginRequest, LoginResponse } from '../types';
import {
  setAuthenticatedUser,
  setAuthError,
  setAuthLoading,
  useAuthStateValue,
} from '../state/authState';

export function useAuth() {
  const navigate = useNavigate();
  const state = useAuthStateValue();

  const setUnexpectedError = () =>
    setAuthError({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
      details: [],
      timestamp: new Date().toISOString(),
      status: 0,
      error: 'Unexpected Error',
      path: '',
      traceId: null,
    } satisfies ApiError);

  function resolvePostLoginTarget(role: string, returnTo?: string): string {
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
    return ROLE_HOME[role] ?? '/';
  }

  async function login(body: LoginRequest, returnTo?: string): Promise<void> {
    const sessionAtStart = beginSessionTransition('login');
    resetSessionState();
    setAuthLoading(true);

    try {
      const res: LoginResponse = await authApi.login(body);
      if (!isCurrentSession(sessionAtStart)) {
        return;
      }

      tokenStorage.setUser(res.user);
      setAuthenticatedUser(res.user);
      navigate(resolvePostLoginTarget(res.user.role, returnTo), { replace: true });
    } catch (err) {
      if (!isCurrentSession(sessionAtStart)) {
        return;
      }

      if (isApiException(err)) {
        setAuthError(err.apiError);
      } else {
        setUnexpectedError();
      }
      throw err;
    }
  }

  async function logout(): Promise<void> {
    const sessionAtStart = beginSessionTransition('logout');

    // Local-first logout: always clear local auth/caches immediately so UI and guards
    // cannot remain authenticated or stuck loading if the server call fails.
    resetSessionState();
    navigate('/');

    // Best-effort server logout. Fire-and-forget so local logout is never blocked.
    void authApi.logout().catch(() => {
      // Swallow errors — local logout is authoritative.
    });

    if (!isCurrentSession(sessionAtStart)) {
      return;
    }
  }

  function clearError(): void {
    setAuthError(null);
  }

  return {
    user: state.user as AuthUser | null,
    authStatus: state.status,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    clearError,
  };
}
