/**
 * Maps each user role to its home route.
 * Single source of truth — imported by route-guards and useAuth.
 * Adding a new role means editing this file only (OCP).
 */
export const ROLE_HOME: Record<string, string> = {
  SUPERVISOR: '/supervisor',
  STUDENT: '/student/projects',
};
