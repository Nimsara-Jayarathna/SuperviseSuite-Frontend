import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/app/layout/PublicLayout';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout onLogin={() => navigate('/login')} onRegister={() => navigate('/register')}>
      <div className="space-y-5 sm:space-y-6">
        <HeroSection
          onStudentPortal={() => navigate('/register')}
          onSupervisorAccess={() => navigate('/login')}
        />
        <FeaturesSection />
      </div>
    </PublicLayout>
  );
}
