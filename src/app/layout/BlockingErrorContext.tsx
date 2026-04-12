import type { ApiError } from '@/types';
import { createContext, useContext } from 'react';

export type BlockingErrorRequest = {
  error: ApiError;
  onRetry?: () => void | Promise<void>;
};

type BlockingErrorContextValue = {
  blockingError: BlockingErrorRequest | null;
  showBlockingError: (error: ApiError, onRetry?: () => void | Promise<void>) => void;
  clearBlockingError: () => void;
};

const noop = () => {};

const BlockingErrorContext = createContext<BlockingErrorContextValue>({
  blockingError: null,
  showBlockingError: noop,
  clearBlockingError: noop,
});

export const BlockingErrorProvider = BlockingErrorContext.Provider;

export function useBlockingError() {
  return useContext(BlockingErrorContext);
}
