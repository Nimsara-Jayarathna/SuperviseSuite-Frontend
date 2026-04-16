import type { ApiError } from '@/types';
import { isApiException } from '@/services/apiClient';

export type RequestModalState = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
  retryAction: (() => void) | null;
};

const UNKNOWN_ERROR: ApiError = {
  code: 'INTERNAL_ERROR',
  message: 'An unexpected error occurred.',
  details: [],
  timestamp: new Date().toISOString(),
  status: 0,
  error: 'Unexpected Error',
  path: '',
  traceId: null,
};

export function toApiError(error: unknown, fallbackMessage: string): ApiError {
  return isApiException(error)
    ? error.apiError
    : {
        ...UNKNOWN_ERROR,
        message: fallbackMessage,
        timestamp: new Date().toISOString(),
      };
}
