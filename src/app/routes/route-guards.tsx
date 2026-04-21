import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { tokenStorage } from '@/services/tokenStorage';
import { ROLE_HOME } from './roleHome';
import { useAuthStateValue } from '@/features/auth/state/authState';

// UI-only preview mode: allow authenticated users to inspect either role's shell locally.
// Enabled only in dev builds (import.meta.env.DEV = true during `vite dev`, false after `vite build`).
// Backend authorization must still enforce the real role restrictions.
const ALLOW_CROSS_ROLE_PREVIEW = import.meta.env.DEV;

function buildLoginRedirectPath(pathname: string, search: string, hash: string): string {
  const returnTo = `${pathname}${search}${hash}`;
  try {
    const key = `login-return:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, returnTo);
    return `/login?returnToKey=${encodeURIComponent(key)}`;
  } catch {
    return '/login';
  }
}

function useResolvedGuardUser() {
  const authState = useAuthStateValue();
  if (authState.status === 'bootstrapping') {
    return tokenStorage.getUser();
  }
  return authState.user;
}

/**
 * Blocks unauthenticated users — redirects to /login.
 * Use for any route that requires a valid session.
 */
export function RequireAuth() {
  const location = useLocation();
  const user = useResolvedGuardUser();
  if (!user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(location.pathname, location.search, location.hash)}
        replace
      />
    );
  }
  return <Outlet />;
}

/**
 * Blocks users without the required role.
 * Security note: this is a UI-only guard — the backend must also enforce
 * role-based access on every protected API endpoint.
 */
export function RequireRole({ role }: { role: string }) {
  const location = useLocation();
  const user = useResolvedGuardUser();
  if (!user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(location.pathname, location.search, location.hash)}
        replace
      />
    );
  }
  if (ALLOW_CROSS_ROLE_PREVIEW) return <Outlet />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
  return <Outlet />;
}

/**
 * Blocks authenticated users from guest-only pages (/login, /register).
 * Redirects them to their role home instead.
 */
export function RequireGuest() {
  const user = useResolvedGuardUser();
  if (!user) return <Outlet />;
  return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
}
