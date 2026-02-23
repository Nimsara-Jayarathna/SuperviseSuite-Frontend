import { PublicLayout } from '@/app/layout/PublicLayout';
import { HeroSection } from '../components/HeroSection';
import { LandingNav } from '../components/LandingNav';

export function LandingPage() {
  return (
    <PublicLayout>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <LandingNav />
        <HeroSection />
        <hr className="border-gray-200" />
      </div>
    </PublicLayout>
  );
}
