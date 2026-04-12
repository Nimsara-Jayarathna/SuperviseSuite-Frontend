import { useEffect, useState } from 'react';
import { PublicLayout } from '@/app/layout/PublicLayout';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { authApi } from '@/features/auth/api/authApi';
import { LoginPanel } from '@/features/auth/components/LoginPanel';
import { RegistrationPanel } from '@/features/auth/components/registration/RegistrationPanel';
import type { RegisterConfig } from '@/features/auth/types';
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
  const handleRegister = async () => {
    if (registrationLoading) return;
    setRegistrationLoading(true);
    try {
      const config = await authApi.getRegisterConfig();
      setRegisterConfig(config);
      setRegistrationOpen(true);
    } catch {
      setRegisterConfig({
        domainRestrictionEnabled: false,
        studentDomain: null,
        supervisorDomain: null,
        studentEmailPrefixRestrictionEnabled: false,
        studentEmailPrefixRegex: null,
      });
      setRegistrationOpen(true);
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
    if (initialRegistrationOpen && registerConfig === null && !registrationLoading) {
      void handleRegister();
    }
    // This should only auto-open for route-driven initial state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRegistrationOpen, registerConfig, registrationLoading]);

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
