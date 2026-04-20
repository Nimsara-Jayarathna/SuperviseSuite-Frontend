import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from './LoginForm';
import { RegistrationPanel } from './registration/RegistrationPanel';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { getBlockingErrorTitle } from '@/utils/errorSeverity';
import { useNavigate } from 'react-router-dom';
import { ModalShell } from '@/components/ui/ModalShell';
import { useRegisterConfig } from '../hooks/useRegisterConfig';

type AuthTab = 'login' | 'register';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthTab;
};

export function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const {
    config: registerConfig,
    isLoading: registerConfigLoading,
    error: registerConfigError,
    clearError: clearRegisterConfigError,
    reload: reloadRegisterConfig,
  } = useRegisterConfig({
    autoLoad: false,
    fallbackMessage: 'Unable to prepare registration right now. Please try again.',
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const {
    login,
    isLoading: loginLoading,
    error: loginError,
    clearError: clearLoginError,
  } = useAuth();

  const openRegisterTab = useCallback(async () => {
    if (registerConfigLoading) {
      return;
    }
    const config = await reloadRegisterConfig();
    if (config) {
      setActiveTab('register');
    }
  }, [registerConfigLoading, reloadRegisterConfig]);

  // Sync active tab when parent re-opens the modal with a different tab
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialTab === 'register') {
      void openRegisterTab();
      return;
    }

    setActiveTab(initialTab);
  }, [isOpen, initialTab, openRegisterTab]);

  if (!isOpen) return null;

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        containerClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
        backdropClassName="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onBackdropClick={onClose}
        ariaLabel={activeTab === 'login' ? 'Sign in' : 'Create account'}
        closeOnEscape
        lockBodyScroll
        autoFocus
        initialFocusRef={dialogRef}
      >
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl focus:outline-none"
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

          <div className="mb-6 flex rounded-lg bg-muted p-1">
            {(['login', 'register'] as AuthTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === 'register') {
                    void openRegisterTab();
                    return;
                  }
                  setActiveTab(tab);
                }}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-center text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {activeTab === 'login' ? (
            <LoginForm
              onSubmit={login}
              isLoading={loginLoading}
              error={loginError}
              onClearError={clearLoginError}
              onSuccess={onClose}
              onForgotPassword={() => {
                onClose();
                navigate('/forgot-password');
              }}
            />
          ) : registerConfig ? (
            <RegistrationPanel inModal={true} config={registerConfig} onClose={onClose} />
          ) : null}

          {activeTab === 'register' && registerConfigLoading && (
            <p className="text-sm text-muted-foreground">Preparing registration...</p>
          )}
        </div>
      </ModalShell>

      <RequestStateModal
        isOpen={loginLoading || !!loginError}
        status={loginLoading ? 'loading' : loginError ? 'error' : 'success'}
        title={loginLoading ? 'Signing in...' : 'Sign in failed'}
        message={
          loginLoading
            ? 'We are verifying your credentials.'
            : loginError?.message || 'Check your internet connection and try again.'
        }
        onClose={clearLoginError}
      />

      <RequestStateModal
        isOpen={registerConfigLoading || Boolean(registerConfigError)}
        status={registerConfigLoading ? 'loading' : 'error'}
        title={
          registerConfigLoading
            ? 'Preparing registration'
            : getBlockingErrorTitle(registerConfigError)
        }
        message={
          registerConfigLoading
            ? 'Checking registration configuration...'
            : (registerConfigError?.message ?? 'Unable to prepare registration right now.')
        }
        onClose={registerConfigLoading ? undefined : clearRegisterConfigError}
        onRetry={
          registerConfigLoading
            ? undefined
            : () => {
                void openRegisterTab();
              }
        }
      />
    </>
  );
}
