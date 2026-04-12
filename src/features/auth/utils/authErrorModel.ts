import type { ApiError } from '@/types';
import { getBlockingErrorTitle, isBlockingError } from '@/utils/errorSeverity';

export function isBlockingAuthError(error: ApiError | null | undefined): boolean {
  return isBlockingError(error);
}

export function getBlockingAuthErrorTitle(error: ApiError | null | undefined): string {
  return getBlockingErrorTitle(error);
}
