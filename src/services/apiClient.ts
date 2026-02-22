import { env } from '@/app/config/env';
import type { ApiError, ApiResponse } from '@/types';
import { tokenStorage } from './tokenStorage';

// ---------------------------------------------------------------------------
// ApiException
// ---------------------------------------------------------------------------

/**
 * Typed error thrown by `apiClient` on every non-2xx response and on network
 * failures. Carries the full ApiError payload so callers can drive UI from
 * `error.code` without inspecting raw HTTP status codes.
 *
 * Always use the `isApiException` type guard before accessing `err.apiError`.
 */
export class ApiException extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiException';
    this.apiError = apiError;
  }
}

/**
 * Type guard that narrows an unknown caught value to `ApiException`.
 *
 * @example
 * try {
 *   await apiClient.post('/api/auth/login', body);
 * } catch (err) {
 *   if (isApiException(err)) {
 *     console.log(err.apiError.code); // 'UNAUTHORIZED'
 *   }
 * }
 */
export function isApiException(error: unknown): error is ApiException {
  return error instanceof ApiException;
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

/**
 * Internal HTTP helper. Attaches the Bearer token when available, enforces
 * the JSON content type, and maps every non-2xx response or network failure
 * to an `ApiException`.
 */
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

// ---------------------------------------------------------------------------
// Public API client
// ---------------------------------------------------------------------------

/**
 * Typed HTTP client used by all feature API modules.
 *
 * All methods return a typed `Promise<T>` on success and throw an
 * `ApiException` (with a structured `ApiError`) on failure.
 *
 * @example
 * import { apiClient, isApiException } from '@/services/apiClient';
 *
 * const user = await apiClient.get<User>('/api/users/me');
 */
export const apiClient = {
  /** Perform a GET request. */
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
  },

  /** Perform a POST request with a JSON body. */
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  },

  /** Perform a PUT request with a JSON body. */
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  },

  /** Perform a PATCH request with a JSON body. */
  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  },

  /** Perform a DELETE request. */
  del<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
};
