import { Button } from '@/components/ui/Button';
import type { ApiError } from '@/types';

/** User-facing title for each error code. Full message comes from the server. */
const ERROR_TITLES: Record<ApiError['code'], string> = {
  VALIDATION_ERROR: 'Invalid Input',
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Session Expired',
  FORBIDDEN: 'Access Denied',
  NOT_FOUND: 'Not Found',
  CONFLICT: 'Conflict',
  TOO_MANY_REQUESTS: 'Too Many Attempts',
  SERVICE_UNAVAILABLE: 'Service Unavailable',
  INTERNAL_ERROR: 'Something Went Wrong',
};

type ErrorStateProps = {
  error: ApiError;
  /** When provided, renders a "Try Again" button. */
  onRetry?: () => void;
};

/** Displays a backend error with title, message, optional field list, and retry button. */
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
          {error.details.map((detail, index) => (
            <li key={`${detail.field}-${index}`}>
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
