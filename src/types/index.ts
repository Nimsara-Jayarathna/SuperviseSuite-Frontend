/** Stable error codes from the backend — use `code` to drive UI logic. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/** Shared meta block included in both success and error envelopes. */
export type ApiMeta = {
  timestamp: string;
  path: string;
  traceId: string | null;
};

/** A single field-level validation error, present in `ApiError.details`. */
export type ApiErrorDetail = {
  field: string;
  /** Backend serialises this as `issue` (from `ApiErrorDetail#getIssue()`). */
  issue?: string;
  /** Kept for forward-compatibility if the backend field is ever renamed to `message`. */
  message?: string;
};

/** Nested backend error object inside the standard response envelope. */
export type ApiErrorBody = {
  code: ApiErrorCode;
  status: number;
  details: ApiErrorDetail[];
};

/**
 * Normalized frontend error consumed by hooks/components.
 *
 * This is derived from the backend response envelope and preserves a flat shape
 * for existing UI code.
 */
export type ApiError = {
  code: ApiErrorCode;
  status: number;
  message: string;
  details: ApiErrorDetail[];
  /** Optional human-readable HTTP reason phrase inferred on the client side. */
  error?: string;
} & ApiMeta;

/** Standard response envelope for all backend endpoints. */
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  error: ApiErrorBody | null;
  meta: ApiMeta;
};
