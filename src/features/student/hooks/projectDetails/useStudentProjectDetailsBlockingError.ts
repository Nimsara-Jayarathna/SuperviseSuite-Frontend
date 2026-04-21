import { useEffect } from 'react';
import { useBlockingError } from '@/app/layout/BlockingErrorContext';
import { isBlockingError } from '@/utils/errorSeverity';
import type { ApiError } from '@/types';

type UseStudentProjectDetailsBlockingErrorParams = {
  error: ApiError | null;
  onRetry: () => void;
};

export function useStudentProjectDetailsBlockingError({
  error,
  onRetry,
}: UseStudentProjectDetailsBlockingErrorParams) {
  const { showBlockingError, clearBlockingError } = useBlockingError();

  useEffect(() => {
    if (error && isBlockingError(error)) {
      showBlockingError(error, onRetry);
      return;
    }

    clearBlockingError();
  }, [error, showBlockingError, clearBlockingError, onRetry]);
}
