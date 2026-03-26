import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/brand/Logo';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/LoginForm';

/**
 * Composition root for the login flow.
 *
 * Open/Closed Principle: LoginPage wires the useAuth hook into
 * LoginForm via props. LoginForm can be extended or tested without
 * modifying this page, and this page does not know about form internals.
 *
 * Dependency Inversion: LoginForm receives abstractions (callbacks + state),
 * not a concrete hook — the hook lives here, at the boundary layer.
 */
export function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const requestModalStatus = isLoading ? 'loading' : 'error';
  const requestModalOpen = isLoading || Boolean(error);
  const requestModalTitle = isLoading ? 'Signing in' : 'Unable to sign in';
  const requestModalMessage = isLoading
    ? 'Please wait while we verify your account credentials.'
    : (error?.message ?? 'Unable to sign in right now. Please try again.');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      {/* Soft gradient orbs in top corners */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <RequestStateModal
          isOpen={requestModalOpen}
          status={requestModalStatus}
          title={requestModalTitle}
          message={requestModalMessage}
          onClose={isLoading ? undefined : clearError}
          onRetry={isLoading ? undefined : clearError}
        />

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link to="/" aria-label="Go to home">
            <LogoMark size={52} className="transition-opacity hover:opacity-80" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Form — receives hook state via props (Dependency Inversion) */}
        <LoginForm
          onSubmit={login}
          isLoading={isLoading}
          error={error}
          onClearError={clearError}
          feedbackMode="modal"
        />

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Need help? Contact support.
        </p>
      </div>
    </div>
  );
}
