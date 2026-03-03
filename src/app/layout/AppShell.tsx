import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/ui/TopBar';
import { tokenStorage } from '@/services/tokenStorage';

type AppShellNavItem = {
  label: string;
  to: string;
  active: boolean;
};

type AppShellProps = {
  role: 'student' | 'supervisor';
  homePath: string;
  navItems: AppShellNavItem[];
  children: ReactNode;
};

export function AppShell({ role, homePath, navItems, children }: AppShellProps) {
  const navigate = useNavigate();
  const user = tokenStorage.getUser();
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : role;

  function handleLogout() {
    tokenStorage.clearAll();
    navigate('/');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />
      <TopBar
        role={role}
        homePath={homePath}
        navItems={navItems}
        userName={fullName || role}
        userEmail={
          user?.email ??
          (role === 'student' ? 'student@supervisesuite.app' : 'supervisor@supervisesuite.app')
        }
        onLogout={handleLogout}
      />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
