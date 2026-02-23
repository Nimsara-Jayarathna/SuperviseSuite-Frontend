import { PublicLayout } from '@/app/layout/PublicLayout';
import { LandingNav } from '../components/LandingNav';

export function LandingPage() {
  return (
    <PublicLayout>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <LandingNav />
      </div>
    </PublicLayout>
  );
}
