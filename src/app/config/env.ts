const CONCATENATED_VITE_ASSIGNMENT_PATTERN = /VITE_[A-Z0-9_]+=/;

export function sanitizeViteEnvValue(rawValue: string): string {
  const trimmed = rawValue.trim();
  const markerIndex = trimmed.search(CONCATENATED_VITE_ASSIGNMENT_PATTERN);

  if (markerIndex <= 0) {
    return trimmed;
  }

  return trimmed.slice(0, markerIndex).trim();
}

export function normalizeApiBaseUrl(rawValue: string): string {
  return sanitizeViteEnvValue(rawValue).replace(/\/+$/, '');
}

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const rawGithubAppInstallUrl = import.meta.env.VITE_GITHUB_APP_INSTALL_URL ?? '';

const apiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);
const githubAppInstallUrl = sanitizeViteEnvValue(rawGithubAppInstallUrl);

if (rawApiBaseUrl.trim() !== apiBaseUrl || rawGithubAppInstallUrl.trim() !== githubAppInstallUrl) {
  // Helps spot broken CI/runtime env injection such as concatenated VITE_* assignments.
  console.error('[env] Malformed VITE env value detected and sanitized.');
}

export const env = {
  apiBaseUrl,
  githubAppInstallUrl,
};
