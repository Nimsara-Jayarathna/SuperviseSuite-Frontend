import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/app/layout/PublicLayout';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { LandingNav } from '../components/LandingNav';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <LandingNav
        onLogin={() => navigate('/login')}
        onRegister={() => navigate('/register')}
      />
      <HeroSection
        onStudentPortal={() => navigate('/register?role=STUDENT')}
        onSupervisorAccess={() => navigate('/register?role=SUPERVISOR')}
      />
      <FeaturesSection />
    </PublicLayout>
  );
}
