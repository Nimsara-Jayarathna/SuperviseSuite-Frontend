import { Navigate, Outlet } from 'react-router-dom';
import { tokenStorage } from '@/services/tokenStorage';

/** Route to redirect to after login, keyed by role */
const ROLE_HOME: Record<string, string> = {
  SUPERVISOR: '/supervisor/dashboard',
  STUDENT: '/student/projects',
};

/**
 * Redirects unauthenticated visitors to /login.
 * Wrap any route that requires a logged-in user.
 */
export function RequireAuth() {
  const token = tokenStorage.getAccessToken();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/**
 * Redirects to / if the authenticated user doesn't have the required role.
 * Also redirects to /login if not authenticated at all.
 */
export function RequireRole({ role }: { role: string }) {
  const user = tokenStorage.getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

/**
 * Redirects already-authenticated users away from guest-only pages
 * (e.g. /login, /register) to their role home.
 */
export function RequireGuest() {
  const user = tokenStorage.getUser();
  if (!user) return <Outlet />;
  return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
}
