import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/app/layout/PublicLayout';
import { authApi } from '@/features/auth/api/authApi';
import { RegistrationPanel } from '@/features/auth/components/registration/RegistrationPanel';
import type { RegisterConfig } from '@/features/auth/types';
import { FinalCTASection } from '../components/FinalCTASection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { WhoItsForSection } from '../components/WhoItsForSection';

export function LandingPage() {
  const navigate = useNavigate();
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
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
      });
      setRegistrationOpen(true);
    } finally {
      setRegistrationLoading(false);
    }
  };
  const handleStudentPortal = () => handleRegister();
  const handleSupervisorAccess = () => navigate('/login');

  return (
    <PublicLayout onLogin={handleSupervisorAccess} onRegister={handleRegister}>
      {registrationLoading && (
        <div className="mb-2 text-center text-sm text-muted-foreground">Preparing registration…</div>
      )}
      {registrationOpen && registerConfig && (
        <RegistrationPanel config={registerConfig} onClose={() => setRegistrationOpen(false)} />
      )}
      <div className="space-y-4 sm:space-y-5">
        <HeroSection
          onStudentPortal={handleStudentPortal}
          onSupervisorAccess={handleSupervisorAccess}
        />
        <FeaturesSection />
        <HowItWorksSection />
        <WhoItsForSection />
        <FinalCTASection
          onStudentPortal={handleStudentPortal}
          onSupervisorAccess={handleSupervisorAccess}
        />
      </div>
    </PublicLayout>
  );
}
