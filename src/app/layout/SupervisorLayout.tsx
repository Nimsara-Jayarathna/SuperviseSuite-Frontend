import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from './AppShell';

export function SupervisorLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const content = children ?? <Outlet />;

  return (
    <AppShell
      role="supervisor"
      homePath="/supervisor"
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
