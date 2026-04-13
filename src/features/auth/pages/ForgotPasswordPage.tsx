import { Button } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { LandingPage } from '@/features/landing';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlockingErrorTitle } from '@/utils/errorSeverity';
import { authApi } from '../api/authApi';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import type { RegisterConfig } from '../types';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

const GENERIC_SUCCESS_MESSAGE =
  'Check your inbox. If that email is registered, a reset link has been sent.';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [error, setError] = useState<ApiError | null>(null);
  const [cooldownKey, setCooldownKey] = useState(0);
  const [registerConfig, setRegisterConfig] = useState<RegisterConfig | null>(null);
  const [registerConfigLoading, setRegisterConfigLoading] = useState(false);
  const [registerConfigError, setRegisterConfigError] = useState<ApiError | null>(null);

  useEffect(() => {
    document.title = 'Forgot your password - SuperviseSuite';
  }, []);

  useEffect(() => {
    async function loadRegisterConfig() {
      setRegisterConfigLoading(true);
      setRegisterConfigError(null);
      try {
        const config = await authApi.getRegisterConfig();
        setRegisterConfig(config);
      } catch (unknownError) {
        if (isApiException(unknownError)) {
          setRegisterConfigError(unknownError.apiError);
        } else {
          setRegisterConfigError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Unable to prepare forgot password right now. Please try again.',
            details: [],
            timestamp: new Date().toISOString(),
            status: 503,
            error: 'Service Unavailable',
            path: '/api/auth/register/config',
            traceId: null,
          });
        }
      } finally {
        setRegisterConfigLoading(false);
      }
    }

    void loadRegisterConfig();
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

  return (
    <>
      <LandingPage />
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <section className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
          <Button
            type="button"
            onClick={() => navigate('/login')}
            aria-label="Close"
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-7 w-7 rounded-full p-0"
          >
            ✕
          </Button>
          <div className="mb-6 mt-4 flex flex-col items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Forgot your password?</h1>
            <p className="text-center text-sm text-muted-foreground">
              Enter your account email and we will send you a reset link.
            </p>
          </div>

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
        </section>
      </div>
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
        onClose={registerConfigLoading ? undefined : () => setRegisterConfigError(null)}
        onRetry={
          registerConfigLoading
            ? undefined
            : () => {
                setRegisterConfigError(null);
                setRegisterConfigLoading(true);
                authApi
                  .getRegisterConfig()
                  .then((config) => setRegisterConfig(config))
                  .catch((unknownError) => {
                    if (isApiException(unknownError)) {
                      setRegisterConfigError(unknownError.apiError);
                    } else {
                      setRegisterConfigError({
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'Unable to prepare forgot password right now. Please try again.',
                        details: [],
                        timestamp: new Date().toISOString(),
                        status: 503,
                        error: 'Service Unavailable',
                        path: '/api/auth/register/config',
                        traceId: null,
                      });
                    }
                  })
                  .finally(() => setRegisterConfigLoading(false));
              }
        }
      />
      <RequestStateModal
        isOpen={status !== 'idle'}
        status={status === 'loading' ? 'loading' : status === 'success' ? 'success' : 'error'}
        title={
          status === 'loading'
            ? 'Sending reset link'
            : status === 'success'
              ? 'Request received'
              : 'Request failed'
        }
        message={
          status === 'loading'
            ? 'Sending reset link... Please wait.'
            : status === 'success'
              ? GENERIC_SUCCESS_MESSAGE
              : error?.message || 'Something went wrong. Please try again.'
        }
        autoCloseOnSuccess={false}
        onClose={handleRequestStateClose}
        footer={
          status === 'success' ? (
            <div className="flex justify-center">
              <Button type="button" variant="secondary" size="md" onClick={handleRequestStateClose}>
                Continue
              </Button>
            </div>
          ) : undefined
        }
      />
    </>
  );
}
