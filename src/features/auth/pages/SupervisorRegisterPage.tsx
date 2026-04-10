import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/brand/Logo';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { RegisterForm } from '../components/RegisterForm';
import { useSupervisorRegister } from '../hooks/useSupervisorRegister';

export function SupervisorRegisterPage() {
  const { register, isLoading, isSuccess, error, clearError } = useSupervisorRegister();
  const requestModalStatus = isLoading ? 'loading' : 'success';
  const requestModalOpen = isLoading || isSuccess;
  const requestModalTitle = isLoading ? 'Creating supervisor account' : 'Registration successful';
  const requestModalMessage = isLoading
    ? 'Please wait while we create your supervisor account.'
    : 'Your supervisor account has been created. Redirecting you to sign in...';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <RequestStateModal
          isOpen={requestModalOpen}
          status={requestModalStatus}
          title={requestModalTitle}
          message={requestModalMessage}
          onClose={undefined}
          onRetry={undefined}
        />

        <div className="mb-6 flex flex-col items-center gap-2">
          <Link to="/" aria-label="Go to home">
            <LogoMark size={52} className="transition-opacity hover:opacity-80" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Create supervisor account</h1>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <RegisterForm
          role="supervisor"
          onSubmit={register}
          isLoading={isLoading}
          error={error}
          onClearError={clearError}
          feedbackMode="inline"
        />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
