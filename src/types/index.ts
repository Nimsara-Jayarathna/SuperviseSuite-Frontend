/** Stable error codes from the backend — use `code` to drive UI logic. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/** A single field-level validation error, present in `ApiError.details`. */
export type ApiErrorDetail = {
  field: string;
  /** Backend serialises this as `issue` (from `ApiErrorDetail#getIssue()`). */
  issue?: string;
  /** Kept for forward-compatibility if the backend field is ever renamed to `message`. */
  message?: string;
};

/** Backend error payload returned on every non-2xx response. */
export type ApiError = {
  timestamp: string;
  status: number;
  error: string;
  code: ApiErrorCode;
  message: string;
  path: string;
  traceId: string | null;
  details: ApiErrorDetail[];
};

/** Standard response envelope for all backend endpoints. */
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  error: ApiError | null;
};
