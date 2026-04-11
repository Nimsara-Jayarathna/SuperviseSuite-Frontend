import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/app/layout/PublicLayout';
import { RegistrationPanel } from '@/features/auth/components/registration/RegistrationPanel';
import { FinalCTASection } from '../components/FinalCTASection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { WhoItsForSection } from '../components/WhoItsForSection';

export function LandingPage() {
  const navigate = useNavigate();
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const handleRegister = () => setRegistrationOpen(true);
  const handleStudentPortal = () => handleRegister();
  const handleSupervisorAccess = () => navigate('/login');

  return (
    <PublicLayout onLogin={handleSupervisorAccess} onRegister={handleRegister}>
      {registrationOpen && <RegistrationPanel onClose={() => setRegistrationOpen(false)} />}
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
