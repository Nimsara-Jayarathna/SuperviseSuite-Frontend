/** Matches the `role` constraint in the users table: SUPERVISOR | STUDENT */
export type UserRole = 'SUPERVISOR' | 'STUDENT';

/** Authenticated user shape returned by the backend */
export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
};

/** POST /api/auth/login request body */
export type LoginRequest = {
  email: string;
  password: string;
};

/** POST /api/auth/register request body */
export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  registrationNumber: string;
};

/** POST /api/auth/register/supervisor request body */
export type SupervisorRegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

/** POST /api/auth/register — newly created student's public profile (no tokens issued) */
export type RegisterResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  registrationNumber: string | null;
  role: UserRole;
};

/**
 * Successful login response.
 *
 * Tokens are no longer included — they are delivered as httpOnly cookies by the
 * backend and are therefore invisible to JavaScript. Only the user profile is
 * returned in the response body so the frontend can populate UI state.
 */
export type LoginResponse = {
  user: AuthUser;
};
