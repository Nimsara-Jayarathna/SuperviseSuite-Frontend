import { Button } from '@/components/ui/Button';
import type { ApiError } from '@/types';

/**
 * Maps each ApiErrorCode to a short, user-facing title displayed in the
 * error state UI. Keep these concise — the full message comes from the server.
 */
const ERROR_TITLES: Record<ApiError['code'], string> = {
  VALIDATION_ERROR: 'Invalid Input',
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Session Expired',
  FORBIDDEN: 'Access Denied',
  NOT_FOUND: 'Not Found',
  CONFLICT: 'Conflict',
  SERVICE_UNAVAILABLE: 'Service Unavailable',
  INTERNAL_ERROR: 'Something Went Wrong',
};

type ErrorStateProps = {
  /** The ApiError payload from `ApiException.apiError`. */
  error: ApiError;
  /**
   * Optional retry callback. When provided, a "Try Again" button is rendered
   * below the error message.
   */
  onRetry?: () => void;
};

/**
 * Reusable error display component driven by the backend ApiError contract.
 *
 * Renders a contextual title, the server-provided message, and — for
 * VALIDATION_ERROR — an itemised list of field-level issues. An optional
 * retry button is shown when `onRetry` is supplied.
 *
 * @example
 * <ErrorState error={err.apiError} onRetry={() => refetch()} />
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const title = ERROR_TITLES[error.code];

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{error.message}</p>

      {error.code === 'VALIDATION_ERROR' && error.details.length > 0 && (
        <ul className="mt-2 list-inside list-disc space-y-0.5">
          {error.details.map((detail) => (
            <li key={detail.field}>
              <span className="font-medium">{detail.field}:</span> {detail.issue}
            </li>
          ))}
        </ul>
      )}

      {onRetry && (
        <Button type="button" onClick={onRetry} className="mt-3">
          Try Again
        </Button>
      )}
    </div>
  );
}
