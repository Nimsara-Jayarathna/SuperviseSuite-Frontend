import { useEffect, useState } from 'react';
import { PublicLayout } from '@/app/layout/PublicLayout';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { authApi } from '@/features/auth/api/authApi';
import { LoginPanel } from '@/features/auth/components/LoginPanel';
import { RegistrationPanel } from '@/features/auth/components/registration/RegistrationPanel';
import type { RegisterConfig } from '@/features/auth/types';
import type { ApiError } from '@/types';
import { isApiException } from '@/services/apiClient';
import { getBlockingErrorTitle } from '@/utils/errorSeverity';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { WhoItsForSection } from '../components/WhoItsForSection';

type LandingPageProps = {
  initialLoginOpen?: boolean;
  initialLoginReturnTo?: string;
  onLoginClose?: () => void;
  initialRegistrationOpen?: boolean;
  onRegistrationClose?: () => void;
};

export function LandingPage({
  initialLoginOpen = false,
  initialLoginReturnTo,
  onLoginClose,
  initialRegistrationOpen = false,
  onRegistrationClose,
}: LandingPageProps = {}) {
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(initialRegistrationOpen);
  const [loginOpen, setLoginOpen] = useState(initialLoginOpen);
  const [registerConfig, setRegisterConfig] = useState<RegisterConfig | null>(null);
  const [registerConfigError, setRegisterConfigError] = useState<ApiError | null>(null);
  const [initialRegistrationAttempted, setInitialRegistrationAttempted] = useState(false);

  function toRegisterConfigError(error: unknown): ApiError {
    if (isApiException(error)) {
      return error.apiError;
    }

    return {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Unable to prepare registration right now. Please try again.',
      details: [],
      timestamp: new Date().toISOString(),
      status: 503,
      error: 'Service Unavailable',
      path: '/api/auth/register/config',
      traceId: null,
    };
  }

  const handleRegister = async () => {
    if (registrationLoading) return;
    setRegistrationLoading(true);
    setRegisterConfigError(null);
    try {
      const config = await authApi.getRegisterConfig();
      setRegisterConfig(config);
      setRegistrationOpen(true);
    } catch (error) {
      setRegistrationOpen(false);
      setRegisterConfigError(toRegisterConfigError(error));
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleLoginClose = () => {
    if (onLoginClose) {
      onLoginClose();
      return;
    }
    setLoginOpen(false);
  };

  const handleRegistrationClose = () => {
    if (onRegistrationClose) {
      onRegistrationClose();
      return;
    }
    setRegistrationOpen(false);
  };

  useEffect(() => {
    if (
      initialRegistrationOpen &&
      registerConfig === null &&
      !registrationLoading &&
      !initialRegistrationAttempted
    ) {
      setInitialRegistrationAttempted(true);
      void handleRegister();
    }
    // This should only auto-open for route-driven initial state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRegistrationOpen, registerConfig, registrationLoading, initialRegistrationAttempted]);

  return (
    <PublicLayout
      onLogin={() => setLoginOpen(true)}
      onRegister={() => {
        void handleRegister();
      }}
    >
      <RequestStateModal
        isOpen={registrationLoading}
        status="loading"
        title="Preparing registration"
        message="Checking registration configuration..."
      />
      <RequestStateModal
        isOpen={Boolean(registerConfigError)}
        status="error"
        title={getBlockingErrorTitle(registerConfigError)}
        message={registerConfigError?.message ?? 'Unable to prepare registration right now.'}
        onClose={() => {
          setRegisterConfigError(null);
          handleRegistrationClose();
        }}
        onRetry={() => {
          void handleRegister();
        }}
      />
      {loginOpen && <LoginPanel returnTo={initialLoginReturnTo} onClose={handleLoginClose} />}
      {registrationOpen && registerConfig && (
        <RegistrationPanel
          config={registerConfig}
          onClose={handleRegistrationClose}
          onSwitchToLogin={() => {
            setRegistrationOpen(false);
            setLoginOpen(true);
          }}
        />
      )}
      <div className="space-y-4 sm:space-y-5">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WhoItsForSection />
      </div>
    </PublicLayout>
  );
}
