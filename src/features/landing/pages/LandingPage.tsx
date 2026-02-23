import { PublicLayout } from '@/app/layout/PublicLayout';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { LandingNav } from '../components/LandingNav';

export function LandingPage() {
  // TODO: replace stubs with auth modal open / route navigation (feat/auth-forms)
  const handleLogin = () => {};
  const handleRegister = () => {};
  const handleStudentPortal = () => {};
  const handleSupervisorAccess = () => {};

  return (
    <PublicLayout>
      <LandingNav onLogin={handleLogin} onRegister={handleRegister} />
      <HeroSection
        onStudentPortal={handleStudentPortal}
        onSupervisorAccess={handleSupervisorAccess}
      />
      <FeaturesSection />
    </PublicLayout>
  );
}
