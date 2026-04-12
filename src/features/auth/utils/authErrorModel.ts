import type { ApiError } from '@/types';

export function isBlockingAuthError(error: ApiError | null | undefined): boolean {
  if (!error) {
    return false;
  }

  return (
    error.code === 'TOO_MANY_REQUESTS'
    || error.code === 'SERVICE_UNAVAILABLE'
    || error.status === 429
    || error.status === 503
  );
}

export function getBlockingAuthErrorTitle(error: ApiError | null | undefined): string {
  if (!error) {
    return 'Request failed';
  }

  if (error.code === 'TOO_MANY_REQUESTS' || error.status === 429) {
    return 'Too many requests';
  }

  if (error.code === 'SERVICE_UNAVAILABLE' || error.status === 503) {
    return 'Service temporarily unavailable';
  }

  return 'Request failed';
}
