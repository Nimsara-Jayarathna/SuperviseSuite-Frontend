import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from './LoginForm';
import { RegistrationPanel } from './registration/RegistrationPanel';

type AuthTab = 'login' | 'register';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthTab;
};

export function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const dialogRef = useRef<HTMLDivElement>(null);
  const {
    login,
    isLoading: loginLoading,
    error: loginError,
    clearError: clearLoginError,
  } = useAuth();

  // Sync active tab when parent re-opens the modal with a different tab
  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Trap focus inside the modal
  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label={activeTab === 'login' ? 'Sign in' : 'Create account'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl focus:outline-none"
      >
        {/* Close button */}
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

        {/* Tab bar */}
        <div className="mb-6 flex rounded-lg bg-muted p-1">
          {(['login', 'register'] as AuthTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
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

        {/* Form */}
        {activeTab === 'login' ? (
          <LoginForm
            onSubmit={login}
            isLoading={loginLoading}
            error={loginError}
            onClearError={clearLoginError}
            onSuccess={onClose}
          />
        ) : (
          <RegistrationPanel inModal={true} onClose={onClose} />
        )}
      </div>
    </div>,
    document.body,
  );
}
