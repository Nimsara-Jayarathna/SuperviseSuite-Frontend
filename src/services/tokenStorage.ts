const ACCESS_TOKEN_KEY = 'ss_access_token';
const REFRESH_TOKEN_KEY = 'ss_refresh_token';
const USER_KEY = 'ss_user';

/**
 * Minimal user shape persisted to localStorage.
 * Kept here to avoid a cross-feature import — auth feature types match this.
 */
export type StoredUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string): void => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  clearAccessToken: (): void => localStorage.removeItem(ACCESS_TOKEN_KEY),

  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearRefreshToken: (): void => localStorage.removeItem(REFRESH_TOKEN_KEY),

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

  /** Clears all auth data — call on logout */
  clearAll: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
