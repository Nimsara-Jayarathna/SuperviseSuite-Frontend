import { env } from '@/app/config/env';
import type { ApiError, ApiResponse } from '@/types';
import { tokenStorage } from './tokenStorage';

/** Thrown by `apiClient` on non-2xx responses and network failures. Carries the typed `ApiError`. */
export class ApiException extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiException';
    this.apiError = apiError;
  }
}

/** Type guard — narrows an unknown caught error to `ApiException`. */
export function isApiException(error: unknown): error is ApiException {
  return error instanceof ApiException;
}

/** Attaches the Bearer token, calls fetch, and maps failures to `ApiException`. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, { ...init, headers });
  } catch {
    // Network failure (offline, DNS error, timeout, etc.)
    const networkError: ApiError = {
      timestamp: new Date().toISOString(),
      status: 503,
      error: 'Service Unavailable',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Unable to reach the server. Please check your connection and try again.',
      path,
      traceId: null,
      details: [],
    };
    throw new ApiException(networkError);
  }

  const body: ApiResponse<T> = await response.json();

  if (!response.ok) {
    // The backend always returns a structured ApiError on non-2xx responses.
    throw new ApiException(body.error!);
  }

  return body.data;
}

/** HTTP client for all backend API calls. Throws `ApiException` on failure. */
export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
  },

  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },

  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  },

  del<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
};
