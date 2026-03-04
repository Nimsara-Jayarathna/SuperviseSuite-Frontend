import type { ReactNode } from 'react';
import { TopBar } from '@/components/ui/TopBar';

type AppShellNavItem = {
  label: string;
  to: string;
  active: boolean;
};

type AppShellProps = {
  role: 'student' | 'supervisor';
  homePath: string;
  navItems: AppShellNavItem[];
  userName: string;
  userEmail: string;
  onLogout: () => Promise<void>;
  children: ReactNode;
};

export function AppShell({ role, homePath, navItems, userName, userEmail, onLogout, children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />
      <TopBar
        role={role}
        homePath={homePath}
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
