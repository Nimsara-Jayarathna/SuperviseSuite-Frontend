import { Button } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { isApiException } from '@/services/apiClient';
import { clearSessionCaches } from '@/services/sessionCache';
import { tokenStorage } from '@/services/tokenStorage';
import type { ApiError } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { getBlockingErrorTitle, isBlockingError } from '@/utils/errorSeverity';
import { AuthPageShell } from '../components/shell/AuthPageShell';
import { AuthDialogCard } from '../components/shell/AuthDialogCard';

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
    setSubmitStatus('loading');
    try {
      await authApi.resetPassword({ token, newPassword });
      setSubmitStatus('success');
    } catch (error) {
      if (isApiException(error)) {
        const newPasswordDetail = error.apiError.details.find(
          (detail) => detail.field === 'newPassword',
        );
        const confirmNewPasswordDetail = error.apiError.details.find(
          (detail) => detail.field === 'confirmNewPassword',
        );
        setSubmitErrorMessage(
          (newPasswordDetail?.message ?? newPasswordDetail?.issue) ||
            (confirmNewPasswordDetail?.message ?? confirmNewPasswordDetail?.issue) ||
            error.apiError.message,
        );
      } else {
        setSubmitErrorMessage('Something went wrong. Please try again.');
      }
      setSubmitStatus('error');
    }
  }

  return (
    <>
      <AuthPageShell>
        {validationStatus === 'valid' ? (
          <AuthDialogCard
            title="Set a new password"
            subtitle="Create a strong password you have not used before."
          >
            <ResetPasswordForm
              onSubmit={handleSubmit}
              isLoading={submitStatus === 'loading'}
              onClearError={() => {
                setSubmitErrorMessage(null);
                if (submitStatus === 'error') {
                  setSubmitStatus('idle');
                }
              }}
            />
          </AuthDialogCard>
        ) : null}
      </AuthPageShell>

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
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => navigate('/forgot-password')}
              >
                Request new link
              </Button>
            </div>
          ) : validationStatus === 'error' ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => void validateResetLink()}
              >
                Try again
              </Button>
            </div>
          ) : undefined
        }
      />

      <RequestStateModal
        isOpen={submitStatus !== 'idle'}
        status={
          submitStatus === 'loading' ? 'loading' : submitStatus === 'success' ? 'success' : 'error'
        }
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
        onRetry={submitStatus === 'error' ? () => setSubmitStatus('idle') : undefined}
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
