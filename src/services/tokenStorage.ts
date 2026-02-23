// Keys used to persist auth data in localStorage.
// Security note: localStorage is readable by any JS on the page.
// If XSS is a concern, prefer httpOnly cookies (backend change required).
const ACCESS_TOKEN_KEY = 'ss_access_token';
const REFRESH_TOKEN_KEY = 'ss_refresh_token';
const USER_KEY = 'ss_user';

/**
 * Minimal user shape persisted to localStorage.
 * Mirrors AuthUser from the auth feature — kept here to avoid a circular import.
 */
export type StoredUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export const tokenStorage = {
  // Access token — short-lived JWT sent in Authorization header
  // Note: presence is checked by route guards, but expiry is NOT verified client-side.
  // Expired tokens will be rejected by the backend on the first real API call.
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string): void => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  clearAccessToken: (): void => localStorage.removeItem(ACCESS_TOKEN_KEY),

  // Refresh token — used to obtain a new access token (handled by apiClient interceptor)
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearRefreshToken: (): void => localStorage.removeItem(REFRESH_TOKEN_KEY),

  // User profile — cached to rehydrate auth state on page reload
  getUser: (): StoredUser | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as StoredUser) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: StoredUser): void => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: (): void => localStorage.removeItem(USER_KEY),

  /** Removes all auth data — call on logout. */
  clearAll: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
