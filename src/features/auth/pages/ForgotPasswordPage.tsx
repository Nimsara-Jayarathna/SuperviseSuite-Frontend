import { Button } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlockingErrorTitle } from '@/utils/errorSeverity';
import { authApi } from '../api/authApi';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { useRegisterConfig } from '../hooks/useRegisterConfig';
import { AuthPageShell } from '../components/shell/AuthPageShell';
import { AuthDialogCard } from '../components/shell/AuthDialogCard';
import { toRequestStateModalView } from '../utils/requestStateModalView';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

const GENERIC_SUCCESS_MESSAGE =
  'Check your inbox. If that email is registered, a reset link has been sent.';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [error, setError] = useState<ApiError | null>(null);
  const [cooldownKey, setCooldownKey] = useState(0);
  const {
    config: registerConfig,
    isLoading: registerConfigLoading,
    error: registerConfigError,
    clearError: clearRegisterConfigError,
    reload: reloadRegisterConfig,
  } = useRegisterConfig({
    fallbackMessage: 'Unable to prepare forgot password right now. Please try again.',
  });

  useEffect(() => {
    document.title = 'Forgot your password - SuperviseSuite';
  }, []);

  async function handleSubmit(email: string) {
    setError(null);
    setStatus('loading');
    try {
      await authApi.forgotPassword({ email });
      setStatus('success');
      setCooldownKey((value) => value + 1);
    } catch (unknownError) {
      if (isApiException(unknownError) && unknownError.apiError.status < 500) {
        setStatus('success');
        setCooldownKey((value) => value + 1);
        return;
      }
      setError(isApiException(unknownError) ? unknownError.apiError : null);
      setStatus('error');
    }
  }

  function handleRequestStateClose() {
    if (status === 'success') {
      setStatus('idle');
      navigate('/');
      return;
    }
    setStatus('idle');
  }

  const requestStateModal = toRequestStateModalView({
    kind: status,
    copy: {
      loading: { title: 'Sending reset link', message: 'Sending reset link... Please wait.' },
      success: { title: 'Request received', message: GENERIC_SUCCESS_MESSAGE },
      error: {
        title: 'Request failed',
        message: error?.message || 'Something went wrong. Please try again.',
      },
    },
    onClose: handleRequestStateClose,
    footer: {
      success: (
        <div className="flex justify-center">
          <Button type="button" variant="secondary" size="md" onClick={handleRequestStateClose}>
            Continue
          </Button>
        </div>
      ),
    },
    autoCloseOnSuccess: false,
    disableCloseWhileLoading: false,
  });

  return (
    <>
      <AuthPageShell>
        <AuthDialogCard
          title="Forgot your password?"
          subtitle="Enter your account email and we will send you a reset link."
          onClose={() => navigate('/login')}
          closeAriaLabel="Close"
        >
          {registerConfig ? (
            <ForgotPasswordForm
              onSubmit={handleSubmit}
              isLoading={status === 'loading'}
              onClearError={() => {
                setError(null);
                if (status === 'error') {
                  setStatus('idle');
                }
              }}
              startCooldownKey={cooldownKey}
              config={registerConfig}
            />
          ) : null}
        </AuthDialogCard>
      </AuthPageShell>
      <RequestStateModal
        isOpen={registerConfigLoading || Boolean(registerConfigError)}
        status={registerConfigLoading ? 'loading' : 'error'}
        title={
          registerConfigLoading
            ? 'Preparing forgot password'
            : getBlockingErrorTitle(registerConfigError)
        }
        message={
          registerConfigLoading
            ? 'Checking registration configuration...'
            : (registerConfigError?.message ?? 'Unable to prepare forgot password right now.')
        }
        onClose={registerConfigLoading ? undefined : clearRegisterConfigError}
        onRetry={
          registerConfigLoading
            ? undefined
            : () => {
                void reloadRegisterConfig();
              }
        }
      />
      <RequestStateModal
        isOpen={requestStateModal.isOpen}
        status={requestStateModal.status}
        title={requestStateModal.title}
        message={requestStateModal.message}
        autoCloseOnSuccess={requestStateModal.autoCloseOnSuccess}
        onClose={requestStateModal.onClose}
        footer={requestStateModal.footer}
      />
    </>
  );
}
