/** Matches the `role` constraint in the users table: SUPERVISOR | STUDENT */
export type UserRole = 'SUPERVISOR' | 'STUDENT';

/** Authenticated user shape returned by the backend */
export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
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
  role: UserRole;
};

/** Successful auth response — access token + user profile */
export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
