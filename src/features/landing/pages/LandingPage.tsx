import { PublicLayout } from '@/app/layout/PublicLayout';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { LandingNav } from '../components/LandingNav';

export function LandingPage() {
  // TODO: wire to router once routing is set up
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
