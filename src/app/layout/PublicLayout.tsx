import type { ReactNode } from 'react';
import { TopBar } from '@/components/ui/TopBar';

type PublicLayoutProps = {
  onLogin: () => void;
  onRegister: () => void;
  children?: ReactNode;
};

export function PublicLayout({ onLogin, onRegister, children }: PublicLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />
      <TopBar
        mode="public"
        homePath="/"
        actions={[
          { label: 'Login', onClick: onLogin, variant: 'ghost' },
          { label: 'Register', onClick: onRegister, variant: 'primary' },
        ]}
      />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children ?? 'Public Layout Placeholder'}
      </main>
    </div>
  );
}
