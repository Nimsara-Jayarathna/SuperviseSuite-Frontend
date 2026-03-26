import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/app/layout/PublicLayout';
import { FinalCTASection } from '../components/FinalCTASection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { WhoItsForSection } from '../components/WhoItsForSection';

export function LandingPage() {
  const navigate = useNavigate();
  const handleStudentPortal = () => navigate('/register');
  const handleSupervisorAccess = () => navigate('/login');

  return (
    <PublicLayout onLogin={handleSupervisorAccess} onRegister={handleStudentPortal}>
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
