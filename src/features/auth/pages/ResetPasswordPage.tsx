import { Button } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { LandingPage } from '@/features/landing';
import { isApiException } from '@/services/apiClient';
import { clearSessionCaches } from '@/services/sessionCache';
import { tokenStorage } from '@/services/tokenStorage';
import type { ApiError } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { getBlockingErrorTitle, isBlockingError } from '@/utils/errorSeverity';
import {
  mapBackendResetPasswordFieldErrors,
  type ResetPasswordFieldErrors,
} from '../utils/resetPasswordValidation';

type ValidationStatus = 'loading' | 'valid' | 'invalid' | 'error';
type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('loading');
  const [validationError, setValidationError] = useState<ApiError | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [submitFieldErrors, setSubmitFieldErrors] = useState<ResetPasswordFieldErrors>({});

  useEffect(() => {
    document.title = 'Reset your password - SuperviseSuite';
  }, []);

  useEffect(() => {
    // Reset-password flow must run as a guest flow.
    // Clear local auth state immediately, then ask backend to revoke cookies.
    clearSessionCaches();
    tokenStorage.clearAll();
    void authApi.logout().catch(() => undefined);
  }, []);

  const validateResetLink = useCallback(async () => {
    setValidationError(null);
    setValidationStatus('loading');
    if (!token) {
      setValidationStatus('invalid');
      return;
    }

    try {
      const response = await authApi.validateResetToken(token);
      if (response.valid) {
        setValidationStatus('valid');
        return;
      }
      setValidationStatus('invalid');
    } catch (error) {
      if (isApiException(error)) {
        setValidationError(error.apiError);
        setValidationStatus(isBlockingError(error.apiError) ? 'error' : 'invalid');
        return;
      }
      setValidationError(null);
      setValidationStatus('error');
    }
  }, [token]);

  useEffect(() => {
    void validateResetLink();
  }, [validateResetLink]);

  async function handleSubmit(newPassword: string) {
    setSubmitErrorMessage(null);
    setSubmitFieldErrors({});
    setSubmitStatus('loading');
    try {
      await authApi.resetPassword({ token, newPassword });
      setSubmitStatus('success');
      return;
    } catch (error) {
      setSubmitStatus('error');
      if (isApiException(error)) {
        const fieldErrors = mapBackendResetPasswordFieldErrors(error.apiError);
        setSubmitFieldErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0) {
          setSubmitStatus('idle');
          return fieldErrors;
        }
        setSubmitErrorMessage(error.apiError.message);
        return;
      }

      setSubmitErrorMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <LandingPage />
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        {validationStatus === 'valid' && (
          <section className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-6 flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Set a new password</h1>
              <p className="text-center text-sm text-muted-foreground">
                Create a strong password you have not used before.
              </p>
            </div>

            <ResetPasswordForm
              onSubmit={handleSubmit}
              isLoading={submitStatus === 'loading'}
              backendFieldErrors={submitFieldErrors}
              onClearError={() => {
                setSubmitErrorMessage(null);
                setSubmitFieldErrors({});
                if (submitStatus === 'error') {
                  setSubmitStatus('idle');
                }
              }}
            />
          </section>
        )}
      </div>

      <RequestStateModal
        isOpen={validationStatus !== 'valid'}
        status={validationStatus === 'loading' ? 'loading' : 'error'}
        title={
          validationStatus === 'loading'
            ? 'Validating link'
            : validationStatus === 'invalid'
              ? 'Link expired or already used'
              : getBlockingErrorTitle(validationError)
        }
        message={
          validationStatus === 'loading'
            ? 'Validating reset token...'
            : validationStatus === 'invalid'
              ? 'This reset link is no longer valid. You can request a new one.'
              : validationError?.message || 'Unable to reach the server. Please try again.'
        }
        footer={
          validationStatus === 'invalid' ? (
            <div className="flex justify-center">
              <Button type="button" variant="primary" size="md" onClick={() => navigate('/forgot-password')}>
                Request new link
              </Button>
            </div>
          ) : validationStatus === 'error' ? (
            <div className="flex justify-center">
              <Button type="button" variant="primary" size="md" onClick={() => void validateResetLink()}>
                Try again
              </Button>
            </div>
          ) : undefined
        }
      />

      <RequestStateModal
        isOpen={submitStatus !== 'idle'}
        status={submitStatus === 'loading' ? 'loading' : submitStatus === 'success' ? 'success' : 'error'}
        title={
          submitStatus === 'loading'
            ? 'Updating password'
            : submitStatus === 'success'
              ? 'Password updated'
              : 'Reset failed'
        }
        message={
          submitStatus === 'loading'
            ? 'Updating your password...'
            : submitStatus === 'success'
              ? 'Your password has been changed. You can now sign in with your new password.'
              : submitErrorMessage || 'Something went wrong. Please try again.'
        }
        autoCloseOnSuccess={false}
        onClose={submitStatus === 'success' ? undefined : () => setSubmitStatus('idle')}
        footer={
          submitStatus === 'success' ? (
            <div className="flex justify-center">
              <Button type="button" variant="primary" size="md" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
          ) : undefined
        }
      />
    </>
  );
}
