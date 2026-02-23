const ACCESS_TOKEN_KEY = 'ss_access_token';
const REFRESH_TOKEN_KEY = 'ss_refresh_token';

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string): void => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  clearAccessToken: (): void => localStorage.removeItem(ACCESS_TOKEN_KEY),

  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearRefreshToken: (): void => localStorage.removeItem(REFRESH_TOKEN_KEY),

  /** Clears both tokens at once — call on logout */
  clearAll: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
