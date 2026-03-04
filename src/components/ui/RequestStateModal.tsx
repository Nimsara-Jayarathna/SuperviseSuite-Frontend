import { Button } from '@/components/ui/Button';

type RequestStateModalProps = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
  onClose?: () => void;
  onRetry?: () => void;
};

function StatusIcon({ status }: { status: RequestStateModalProps['status'] }) {
  if (status === 'loading') {
    return (
      <span className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
    );
  }

  if (status === 'success') {
    return (
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl font-semibold text-emerald-700">
        ✓
      </span>
    );
  }

  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl font-semibold text-rose-700">
      !
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
}: RequestStateModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <StatusIcon status={status} />
          <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{message}</p>
        </div>

        {status !== 'loading' ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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
}
