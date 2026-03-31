import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type RequestStateModalProps = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  onClose?: () => void;
  onRetry?: () => void;
  content?: ReactNode;
  footer?: ReactNode;
  autoCloseOnSuccess?: boolean;
};

const STATUS_STYLES: Record<
  RequestStateModalProps['status'],
  {
    iconContainer: string;
    gradientOverlay: string;
  }
> = {
  loading: {
    iconContainer: 'bg-sky-100/85 text-sky-700',
    gradientOverlay: 'from-sky-100/85 via-white/70 to-sky-200/55',
  },
  success: {
    iconContainer: 'bg-emerald-100/85 text-emerald-700',
    gradientOverlay: 'from-emerald-100/85 via-white/70 to-emerald-200/55',
  },
  error: {
    iconContainer: 'bg-rose-100/85 text-rose-700',
    gradientOverlay: 'from-rose-100/85 via-white/70 to-rose-200/55',
  },
  warning: {
    iconContainer: 'bg-amber-100/85 text-amber-700',
    gradientOverlay: 'from-amber-100/85 via-white/70 to-amber-200/55',
  },
};

function StatusIcon({ status }: { status: RequestStateModalProps['status'] }) {
  const styles = STATUS_STYLES[status];

  if (status === 'loading') {
    return (
      <span
        className={cn(
          'inline-flex h-12 w-12 items-center justify-center rounded-full',
          styles.iconContainer,
        )}
      >
        <Loader2 className="h-6 w-6 animate-spin" />
      </span>
    );
  }

  if (status === 'success') {
    return (
      <span
        className={cn(
          'inline-flex h-12 w-12 items-center justify-center rounded-full',
          styles.iconContainer,
        )}
      >
        <CheckCircle className="h-6 w-6" />
      </span>
    );
  }

  if (status === 'warning') {
    return (
      <span
        className={cn(
          'inline-flex h-12 w-12 items-center justify-center rounded-full',
          styles.iconContainer,
        )}
      >
        <AlertTriangle className="h-6 w-6" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-full',
        styles.iconContainer,
      )}
    >
      <XCircle className="h-6 w-6" />
    </span>
  );
}

export function RequestStateModal({
  isOpen,
  status,
  title,
  message,
  onClose,
  onRetry,
  content,
  footer,
  autoCloseOnSuccess = true,
}: RequestStateModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const styles = STATUS_STYLES[status];

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || status !== 'success' || !onClose || !autoCloseOnSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, status, onClose, title, message, autoCloseOnSuccess]);

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-md transition-opacity duration-250',
        isMounted ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-3xl border border-white/35 bg-white/65 p-6 shadow-[0_26px_72px_rgba(15,23,42,0.24)] backdrop-blur-md transition-all duration-300 ease-out',
          isMounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br',
            styles.gradientOverlay,
          )}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[inherit] bg-gradient-to-b from-white/55 to-transparent" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <StatusIcon status={status} />
          <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{message}</p>
          {content ? <div className="mt-4 w-full">{content}</div> : null}
        </div>

        {footer ? (
          <div className="relative z-10 mt-6">{footer}</div>
        ) : status !== 'loading' ? (
          <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-3">
            {status === 'error' && onRetry ? (
              <Button type="button" variant="primary" size="md" onClick={onRetry}>
                Retry
              </Button>
            ) : null}
            {onClose ? (
              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                {status === 'success' ? 'Continue' : 'Close'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}
