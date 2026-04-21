import { Button } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { isApiException } from '@/services/apiClient';
import { beginSessionTransition, resetSessionState } from '@/services/sessionState';
import type { ApiError } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { getBlockingErrorTitle, isBlockingError } from '@/utils/errorSeverity';
import { AuthPageShell } from '../components/shell/AuthPageShell';
import { AuthDialogCard } from '../components/shell/AuthDialogCard';
import { toRequestStateModalView } from '../utils/requestStateModalView';

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
    beginSessionTransition('logout');
    resetSessionState();
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

  const submitStateModal = toRequestStateModalView({
    kind: submitStatus,
    copy: {
      loading: { title: 'Updating password', message: 'Updating your password...' },
      success: {
        title: 'Password updated',
        message: 'Your password has been changed. You can now sign in with your new password.',
      },
      error: {
        title: 'Reset failed',
        message: submitErrorMessage || 'Something went wrong. Please try again.',
      },
    },
    onClose: submitStatus === 'success' ? undefined : () => setSubmitStatus('idle'),
    onRetry: submitStatus === 'error' ? () => setSubmitStatus('idle') : undefined,
    footer: {
      success: (
        <div className="flex justify-center">
          <Button type="button" variant="primary" size="md" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        </div>
      ),
    },
    autoCloseOnSuccess: false,
    disableCloseWhileLoading: true,
  });

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
        isOpen={submitStateModal.isOpen}
        status={submitStateModal.status}
        title={submitStateModal.title}
        message={submitStateModal.message}
        autoCloseOnSuccess={submitStateModal.autoCloseOnSuccess}
        onClose={submitStateModal.onClose}
        onRetry={submitStateModal.onRetry}
        footer={submitStateModal.footer}
      />
    </>
  );
}
