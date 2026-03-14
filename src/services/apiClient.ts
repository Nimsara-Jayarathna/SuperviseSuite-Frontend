import { env } from '@/app/config/env';
import type { ApiError, ApiResponse } from '@/types';
import { tokenStorage } from './tokenStorage';
import type { StoredUser } from './tokenStorage';

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

const REFRESH_PATH = '/api/auth/refresh';
const AUTH_PATH_PREFIX = '/api/auth/';
let inFlightRefresh: Promise<boolean> | null = null;

/**
 * Attempts a silent token refresh using the {@code ss_refresh_token} httpOnly cookie.
 *
 * This is a raw {@code fetch} call intentionally — importing {@code authApi} here would
 * create a circular dependency because {@code authApi} itself imports {@code apiClient}.
 *
 * Returns {@code true} if the refresh succeeded and the user profile has been
 * updated in storage; {@code false} if the session is fully expired.
 */
async function tryRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${env.apiBaseUrl}${REFRESH_PATH}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as ApiResponse<{ user: StoredUser }>;
    if (body?.data?.user) {
      tokenStorage.setUser(body.data.user);
    }
    return true;
  } catch {
    return false;
  }
}

async function tryRefreshSingleFlight(): Promise<boolean> {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = tryRefresh().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

function isAuthEndpoint(path: string): boolean {
  return path.startsWith(AUTH_PATH_PREFIX);
}

async function parseJsonSafely(response: Response): Promise<unknown | null> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function hasApiErrorShape(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiError).status === 'number' &&
    typeof (value as ApiError).code === 'string' &&
    typeof (value as ApiError).message === 'string'
  );
}

/**
 * Core request function. Sends cookies automatically via {@code credentials: 'include'}.
 * No Authorization header — the access token lives in an httpOnly cookie.
 *
 * 401 interceptor: on a first 401, silently calls {@code POST /api/auth/refresh}.
 * If the refresh succeeds, the original request is retried once.
 * If the refresh also fails (expired session), local state is cleared and the
 * browser is redirected to {@code /login}.
 *
 * @param isRetry - true when this call is the post-refresh retry; prevents infinite loops.
 */
async function request<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  // Use Headers to safely normalise any init.headers format (object, Headers instance, or tuples).
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include', // send httpOnly cookies on every request
    });
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

  // 401 interceptor: attempt one silent refresh only for protected endpoints.
  // Never refresh on public auth endpoints (e.g. /api/auth/login), because a 401
  // there means invalid credentials, not an expired authenticated session.
  if (response.status === 401 && !isAuthEndpoint(path) && !isRetry) {
    const refreshed = await tryRefreshSingleFlight();
    if (refreshed) {
      return request<T>(path, init, true);
    }
    // Refresh also failed — session is fully expired.
    tokenStorage.clearAll();
    window.location.href = '/login';
    throw new ApiException({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
      message: 'Your session has expired. Please log in again.',
      path,
      traceId: null,
      details: [],
    });
  }

  // 204 No Content — no body to parse, return undefined as the empty payload.
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const body = await parseJsonSafely(response);

  if (!response.ok) {
    // Backend errors are expected as raw ApiError JSON. Fall back safely when a proxy
    // or unexpected middleware returns an empty or non-JSON body.
    throw new ApiException(
      hasApiErrorShape(body)
        ? body
        : {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText,
        code: response.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
        message: response.status === 401 ? 'Authentication failed.' : 'An unexpected error occurred.',
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
