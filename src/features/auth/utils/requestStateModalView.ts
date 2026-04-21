import type { ReactNode } from 'react';

export type AsyncRequestKind = 'idle' | 'loading' | 'success' | 'error';

export type RequestStateModalView = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  onClose?: () => void;
  onRetry?: () => void;
  footer?: ReactNode;
  autoCloseOnSuccess?: boolean;
};

type CopyValue = string | ((kind: Exclude<AsyncRequestKind, 'idle'>) => string);

type Copy = {
  loading: { title: string; message: CopyValue };
  success: { title: string; message: CopyValue };
  error: { title: string; message: CopyValue };
};

export function toRequestStateModalView(args: {
  kind: AsyncRequestKind;
  copy: Copy;
  onClose?: () => void;
  onRetry?: () => void;
  footer?: Partial<Record<'success' | 'error', ReactNode>>;
  autoCloseOnSuccess?: boolean;
  disableCloseWhileLoading?: boolean;
}): RequestStateModalView {
  const {
    kind,
    copy,
    onClose,
    onRetry,
    footer,
    autoCloseOnSuccess,
    disableCloseWhileLoading = true,
  } = args;

  if (kind === 'idle') {
    return {
      isOpen: false,
      status: 'loading',
      title: '',
      message: '',
    };
  }

  const resolved =
    kind === 'loading' ? copy.loading : kind === 'success' ? copy.success : copy.error;

  const resolveCopyValue = (value: CopyValue) =>
    typeof value === 'function' ? value(kind) : value;

  const isLoading = kind === 'loading';
  const effectiveOnClose = isLoading && disableCloseWhileLoading ? undefined : onClose;

  return {
    isOpen: true,
    status: kind === 'loading' ? 'loading' : kind === 'success' ? 'success' : 'error',
    title: resolved.title,
    message: resolveCopyValue(resolved.message),
    onClose: effectiveOnClose,
    onRetry: kind === 'error' ? onRetry : undefined,
    footer: kind === 'success' ? footer?.success : kind === 'error' ? footer?.error : undefined,
    autoCloseOnSuccess,
  };
}
