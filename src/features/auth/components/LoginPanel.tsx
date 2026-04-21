import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { getBlockingErrorTitle, isBlockingError } from '@/utils/errorSeverity';
import { ModalShell } from '@/components/ui/ModalShell';
import { AuthDialogCard } from './shell/AuthDialogCard';

type LoginPanelProps = {
  onClose: () => void;
  returnTo?: string;
  inModal?: boolean;
};

export function LoginPanel({ onClose, returnTo, inModal = false }: LoginPanelProps) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLElement>(null);
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
          <AuthDialogCard
            ref={dialogRef}
            tabIndex={-1}
            title="Welcome back!"
            onClose={onClose}
            closeAriaLabel="Close"
            className="mx-auto focus:outline-none"
          >
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
          </AuthDialogCard>
        </ModalShell>
      ) : (
        <AuthDialogCard
          ref={dialogRef}
          tabIndex={-1}
          title="Welcome back!"
          onClose={onClose}
          closeAriaLabel="Close"
          className="mx-auto focus:outline-none"
        >
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
        </AuthDialogCard>
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
