import { useState } from 'react';
import { PublicLayout } from '@/app/layout/PublicLayout';
import { AuthModal } from '@/features/auth/components/AuthModal';
import type { UserRole } from '@/features/auth/types';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { LandingNav } from '../components/LandingNav';

type ModalState = {
  isOpen: boolean;
  tab: 'login' | 'register';
  initialRole?: UserRole;
};

const CLOSED: ModalState = { isOpen: false, tab: 'login' };

export function LandingPage() {
  const [modal, setModal] = useState<ModalState>(CLOSED);

  const openLogin = () => setModal({ isOpen: true, tab: 'login' });
  const openRegister = (role?: UserRole) =>
    setModal({ isOpen: true, tab: 'register', initialRole: role });
  const closeModal = () => setModal(CLOSED);

  return (
    <PublicLayout>
      <LandingNav onLogin={openLogin} onRegister={() => openRegister()} />
      <HeroSection
        onStudentPortal={() => openRegister('STUDENT')}
        onSupervisorAccess={() => openRegister('SUPERVISOR')}
      />
      <FeaturesSection />
      <AuthModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        initialTab={modal.tab}
        initialRole={modal.initialRole}
      />
    </PublicLayout>
  );
}
