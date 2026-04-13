import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LoginForm } from './LoginForm';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { getBlockingAuthErrorTitle, isBlockingAuthError } from '../utils/authErrorModel';

type LoginPanelProps = {
  onClose: () => void;
  returnTo?: string;
  inModal?: boolean;
};

export function LoginPanel({ onClose, returnTo, inModal = false }: LoginPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { login, isLoading, error, clearError } = useAuth();
  const blockingError = isBlockingAuthError(error) ? error : null;
  const inlineError = blockingError ? null : error;

  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const panelContent = (
    <>
      {!inModal && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`${inModal ? '' : 'fixed inset-0 z-50 flex items-center justify-center p-4'}`}
      >
        {!inModal && (
          <>
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          </>
        )}
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
          />
        </div>
      </div>
      <RequestStateModal
        isOpen={isLoading || !!blockingError}
        status={isLoading ? 'loading' : 'error'}
        title={isLoading ? 'Signing in...' : getBlockingAuthErrorTitle(blockingError)}
        message={
          isLoading
            ? 'We are verifying your credentials.'
            : blockingError?.message || 'Please try again later.'
        }
        onClose={clearError}
      />
    </>
  );

  if (!inModal && typeof document !== 'undefined') {
    return createPortal(panelContent, document.body);
  }

  return panelContent;
}
