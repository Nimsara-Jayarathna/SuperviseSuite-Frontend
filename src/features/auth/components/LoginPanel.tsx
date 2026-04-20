import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { getBlockingErrorTitle, isBlockingError } from '@/utils/errorSeverity';
import { ModalShell } from '@/components/ui/ModalShell';

type LoginPanelProps = {
  onClose: () => void;
  returnTo?: string;
  inModal?: boolean;
};

export function LoginPanel({ onClose, returnTo, inModal = false }: LoginPanelProps) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { login, isLoading, error, clearError } = useAuth();
  const blockingError = isBlockingError(error) ? error : null;
  const inlineError = blockingError ? null : error;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const panelContent = (
    <>
      {!inModal ? (
        <ModalShell
          isOpen
          containerClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
          backdropClassName="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          onBackdropClick={onClose}
          closeOnEscape
          autoFocus
          initialFocusRef={dialogRef}
        >
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl focus:outline-none"
          >
            <Button
              type="button"
              onClick={onClose}
              aria-label="Close"
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 h-7 w-7 rounded-full p-0"
            >
              ✕
            </Button>

            <div className="mb-6 flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Welcome back!</h1>
            </div>

            <LoginForm
              onSubmit={(values) => login(values, returnTo)}
              isLoading={isLoading}
              error={inlineError}
              onClearError={clearError}
              onSuccess={onClose}
              feedbackMode="inline"
              onForgotPassword={() => {
                onClose();
                navigate('/forgot-password');
              }}
            />
          </div>
        </ModalShell>
      ) : (
        <div>
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl focus:outline-none"
          >
            <Button
              type="button"
              onClick={onClose}
              aria-label="Close"
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 h-7 w-7 rounded-full p-0"
            >
              ✕
            </Button>

            <div className="mb-6 flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Welcome back!</h1>
            </div>

            <LoginForm
              onSubmit={(values) => login(values, returnTo)}
              isLoading={isLoading}
              error={inlineError}
              onClearError={clearError}
              onSuccess={onClose}
              feedbackMode="inline"
              onForgotPassword={() => {
                onClose();
                navigate('/forgot-password');
              }}
            />
          </div>
        </div>
      )}
      <RequestStateModal
        isOpen={isLoading || !!blockingError}
        status={isLoading ? 'loading' : 'error'}
        title={isLoading ? 'Signing in...' : getBlockingErrorTitle(blockingError)}
        message={
          isLoading
            ? 'We are verifying your credentials.'
            : blockingError?.message || 'Please try again later.'
        }
        onClose={clearError}
      />
    </>
  );

  return panelContent;
}
