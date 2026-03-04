import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/app/layout/PublicLayout';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { LandingNav } from '../components/LandingNav';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <LandingNav onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />
      <main className="relative z-10 pb-12 sm:pb-16">
        <HeroSection
          onStudentPortal={() => navigate('/register')}
          onSupervisorAccess={() => navigate('/login')}
        />
        <FeaturesSection onGetStarted={() => navigate('/register')} />
      </main>
    </PublicLayout>
  );
}
