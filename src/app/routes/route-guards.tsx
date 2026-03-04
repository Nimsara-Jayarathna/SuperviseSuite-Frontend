import { Navigate, Outlet } from 'react-router-dom';
import { tokenStorage } from '@/services/tokenStorage';

// Role → home route mapping, shared across all guards.
const ROLE_HOME: Record<string, string> = {
  SUPERVISOR: '/supervisor',
  STUDENT: '/student/projects',
};

// UI-only preview mode: allow authenticated users to inspect either role's shell locally.
// Backend authorization must still enforce the real role restrictions.
const ALLOW_CROSS_ROLE_PREVIEW = true;

/**
 * Blocks unauthenticated users — redirects to /login.
 * Use for any route that requires a valid session.
 */
export function RequireAuth() {
  const user = tokenStorage.getUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/**
 * Blocks users without the required role.
 * Security note: this is a UI-only guard — the backend must also enforce
 * role-based access on every protected API endpoint.
 */
export function RequireRole({ role }: { role: string }) {
  const user = tokenStorage.getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (ALLOW_CROSS_ROLE_PREVIEW) return <Outlet />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
  return <Outlet />;
}

/**
 * Blocks authenticated users from guest-only pages (/login, /register).
 * Redirects them to their role home instead.
 */
export function RequireGuest() {
  const user = tokenStorage.getUser();
  if (!user) return <Outlet />;
  return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
}
