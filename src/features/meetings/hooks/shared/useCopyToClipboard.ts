import { useCallback } from 'react';

type CopyErrorHandler = (retryAction: () => void) => void;

export function useCopyToClipboard(onCopyError: CopyErrorHandler) {
  const copyToClipboard = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        onCopyError(() => void copyToClipboard(value));
        return false;
      }
    },
    [onCopyError],
  );

  return copyToClipboard;
}
