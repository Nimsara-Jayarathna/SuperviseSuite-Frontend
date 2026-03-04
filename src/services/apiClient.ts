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
  const token = tokenStorage.getAccessToken();

  // Use Headers to safely normalise any init.headers format (object, Headers instance, or tuples).
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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

  // 204 No Content — no body to parse, return undefined as the empty payload.
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const body: unknown = await response.json();

  if (!response.ok) {
    // GlobalExceptionHandler returns a raw ApiError body (not wrapped in ApiResponse).
    // Cast directly — fall back to a synthetic error if the shape is unexpected.
    throw new ApiException(
      (body as ApiError) ?? {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        path,
        traceId: null,
        details: [],
      },
    );
  }

  return (body as ApiResponse<T>).data;
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
