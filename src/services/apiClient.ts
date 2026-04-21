import { env } from '@/app/config/env';
import type { ApiError, ApiErrorBody, ApiMeta, ApiResponse } from '@/types';
import { tokenStorage } from './tokenStorage';
import type { StoredUser } from './tokenStorage';
import { beginSessionTransition, resetSessionState } from './sessionState';
import { createManagedAbortSignal } from './requestRegistry';

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
type WrappedApiErrorResponse = {
  success: false;
  message: string;
  data: null;
  error: ApiErrorBody;
  meta: ApiMeta;
};

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
    if (body?.success && body?.data?.user) {
      tokenStorage.setUser(body.data.user);
    }
    return body?.success === true;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasApiMetaShape(value: unknown): value is ApiMeta {
  return (
    isRecord(value) &&
    typeof value.timestamp === 'string' &&
    typeof value.path === 'string' &&
    (typeof value.traceId === 'string' || value.traceId === null)
  );
}

function hasApiErrorBodyShape(value: unknown): value is ApiErrorBody {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.status === 'number' &&
    Array.isArray(value.details)
  );
}

function hasApiEnvelopeShape(value: unknown): value is ApiResponse<unknown> {
  return (
    isRecord(value) &&
    typeof value.success === 'boolean' &&
    typeof value.message === 'string' &&
    'data' in value &&
    'error' in value &&
    hasApiMetaShape(value.meta)
  );
}

function hasWrappedApiErrorShape(value: unknown): value is WrappedApiErrorResponse {
  return hasApiEnvelopeShape(value) && value.success === false && hasApiErrorBodyShape(value.error);
}

function hasLegacyApiErrorShape(value: unknown): value is ApiError {
  return (
    isRecord(value) &&
    typeof value.status === 'number' &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  );
}

function normalizeDetails(value: unknown): ApiError['details'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((detail) => isRecord(detail) && typeof detail.field === 'string')
    .map((detail) => ({
      field: detail.field as string,
      issue: typeof detail.issue === 'string' ? detail.issue : undefined,
      message: typeof detail.message === 'string' ? detail.message : undefined,
    }));
}

function createFallbackError(path: string, status: number, statusText: string): ApiError {
  return {
    timestamp: new Date().toISOString(),
    status,
    error: statusText || (status === 401 ? 'Unauthorized' : 'Internal Server Error'),
    code: status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
    message: status === 401 ? 'Authentication failed.' : 'An unexpected error occurred.',
    path,
    traceId: null,
    details: [],
  };
}

function normalizeError(path: string, response: Response, body: unknown): ApiError {
  if (hasWrappedApiErrorShape(body)) {
    return {
      timestamp: body.meta.timestamp,
      status: body.error.status,
      error: response.statusText || (body.error.status === 401 ? 'Unauthorized' : 'Request Failed'),
      code: body.error.code,
      message: body.message,
      path: body.meta.path || path,
      traceId: body.meta.traceId,
      details: normalizeDetails(body.error.details),
    };
  }

  if (hasLegacyApiErrorShape(body)) {
    return {
      timestamp: body.timestamp ?? new Date().toISOString(),
      status: body.status,
      error: body.error,
      code: body.code,
      message: body.message,
      path: body.path ?? path,
      traceId: body.traceId ?? null,
      details: normalizeDetails(body.details),
    };
  }

  if (hasApiEnvelopeShape(body) && body.success === false) {
    const fallbackStatus = hasApiErrorBodyShape(body.error) ? body.error.status : response.status;
    const fallbackCode = hasApiErrorBodyShape(body.error) ? body.error.code : 'INTERNAL_ERROR';
    const fallbackDetails = hasApiErrorBodyShape(body.error) ? body.error.details : [];
    return {
      timestamp: body.meta.timestamp,
      status: fallbackStatus,
      error: response.statusText || (fallbackStatus === 401 ? 'Unauthorized' : 'Request Failed'),
      code: fallbackCode,
      message: body.message,
      path: body.meta.path || path,
      traceId: body.meta.traceId,
      details: normalizeDetails(fallbackDetails),
    };
  }

  return createFallbackError(path, response.status, response.statusText);
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

  const managed = createManagedAbortSignal();
  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      signal: managed.signal,
      headers,
      credentials: 'include', // send httpOnly cookies on every request
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiException({
        timestamp: new Date().toISOString(),
        status: 499,
        error: 'Client Closed Request',
        code: 'INTERNAL_ERROR',
        message: 'Request was cancelled.',
        path,
        traceId: null,
        details: [],
      });
    }

    // Network failure (offline, DNS error, timeout, etc.)
    throw new ApiException({
      timestamp: new Date().toISOString(),
      status: 503,
      error: 'Service Unavailable',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Unable to reach the server. Please check your connection and try again.',
      path,
      traceId: null,
      details: [],
    });
  } finally {
    managed.release();
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
    beginSessionTransition('session-expired');
    resetSessionState();
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
    // Backend errors are wrapped in the standard response envelope.
    // Fall back safely for empty/non-JSON/proxy responses.
    throw new ApiException(normalizeError(path, response, body));
  }

  if (hasApiEnvelopeShape(body)) {
    if (body.success === false) {
      throw new ApiException(normalizeError(path, response, body));
    }
    return body.data as T;
  }

  return body as T;
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
