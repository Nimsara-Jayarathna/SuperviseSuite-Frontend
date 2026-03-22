function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  githubPageSize: parsePositiveInt(import.meta.env.VITE_GITHUB_PAGE_SIZE, 10),
  githubAppInstallUrl: import.meta.env.VITE_GITHUB_APP_INSTALL_URL ?? '',
};
