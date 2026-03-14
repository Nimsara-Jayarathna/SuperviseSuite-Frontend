import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/brand/Logo';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { RegisterForm } from '../components/RegisterForm';
import { useRegister } from '../hooks/useRegister';

/**
 * Composition root for the registration flow.
 *
 * Open/Closed Principle: RegisterPage wires the useRegister hook into
 * RegisterForm via props. RegisterForm can be extended or tested without
 * modifying this page, and this page does not know about form internals.
 *
 * Dependency Inversion: RegisterForm receives abstractions (callbacks + state),
 * not a concrete hook — the hook lives here, at the boundary layer.
 */
export function RegisterPage() {
  const { register, isLoading, error, clearError } = useRegister();
  const requestModalStatus = isLoading ? 'loading' : 'error';
  const requestModalOpen = isLoading || Boolean(error);
  const requestModalTitle = isLoading ? 'Creating account' : 'Unable to create account';
  const requestModalMessage = isLoading
    ? 'Please wait while we create your account.'
    : (error?.message ?? 'Unable to create your account right now. Please try again.');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      {/* Background gradient orbs */}
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
          <h1 className="text-xl font-bold text-foreground">Get started today!</h1>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Form — receives hook state via props (Dependency Inversion) */}
        <RegisterForm
          onSubmit={register}
          isLoading={isLoading}
          error={error}
          onClearError={clearError}
          feedbackMode="modal"
        />

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
