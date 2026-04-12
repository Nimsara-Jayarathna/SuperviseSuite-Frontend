import type { ApiError } from '@/types';
import { createContext, useContext } from 'react';

type BlockingErrorContextValue = {
  blockingError: ApiError | null;
  showBlockingError: (error: ApiError) => void;
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
