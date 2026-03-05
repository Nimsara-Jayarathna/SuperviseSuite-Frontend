import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { AppShell } from './AppShell';

export function SupervisorLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const content = children ?? <Outlet />;

  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Supervisor';
  const userEmail = user?.email ?? 'supervisor@supervisesuite.app';

  return (
    <AppShell
      role="supervisor"
      homePath="/supervisor"
      userName={userName}
      userEmail={userEmail}
      onLogout={logout}
      navItems={[
        {
          label: 'Dashboard',
          to: '/supervisor',
          active:
            location.pathname === '/supervisor' || location.pathname === '/supervisor/dashboard',
        },
        {
          label: 'Projects',
          to: '/supervisor/projects',
          active:
            location.pathname.startsWith('/supervisor/projects') ||
            location.pathname.startsWith('/supervisor/project'),
        },
      ]}
    >
      {content}
    </AppShell>
  );
}
