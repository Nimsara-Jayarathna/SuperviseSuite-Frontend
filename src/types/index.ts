/**
 * All stable error codes returned by the SuperviseSuite backend.
 * Mirrors the `code` field in every non-2xx API response.
 * See: SuperviseSuite-Backend/docs/api/error-handling.md
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/**
 * A single field-level validation error.
 * Present in `ApiError.details` when `code` is `VALIDATION_ERROR`.
 */
export type ApiErrorDetail = {
  /** The request field that failed validation (e.g. "email"). */
  field: string;
  /** Human-readable reason the field is invalid. */
  issue: string;
};

/**
 * The error payload returned by the backend on every non-2xx response.
 * Matches the `error` field of the ApiResponse envelope.
 */
export type ApiError = {
  /** ISO-8601 timestamp of when the error occurred. */
  timestamp: string;
  /** HTTP status code (e.g. 400, 401, 404). */
  status: number;
  /** HTTP status phrase (e.g. "Bad Request"). */
  error: string;
  /** Stable machine-readable error code — use this to drive UI logic. */
  code: ApiErrorCode;
  /** Human-readable message safe to display to the user. */
  message: string;
  /** The request path that triggered the error. */
  path: string;
  /** Trace ID for correlating logs, present when tracing is enabled. */
  traceId: string | null;
  /** Field-level detail list, populated only when code is VALIDATION_ERROR. */
  details: ApiErrorDetail[];
};

/**
 * Generic success response wrapper returned by every backend endpoint.
 * On success, `data` contains the payload and `error` is null.
 * On failure, `error` contains the ApiError and `data` should be ignored.
 */
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  error: ApiError | null;
};
