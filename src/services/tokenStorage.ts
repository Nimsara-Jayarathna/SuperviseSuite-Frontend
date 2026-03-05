// Tokens are now delivered as httpOnly cookies by the backend and are
// invisible to JavaScript. This module only persists the user profile,
// which is needed to rehydrate UI state (role-based routing, display name)
// across page reloads without making an extra API call.
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
  // User profile — cached to rehydrate auth state on page reload.
  // This is the only piece of auth data the frontend stores; tokens live
  // exclusively in httpOnly cookies managed by the browser.
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

  /** Removes all auth data from localStorage — call on logout. */
  clearAll: (): void => {
    localStorage.removeItem(USER_KEY);
  },
};
