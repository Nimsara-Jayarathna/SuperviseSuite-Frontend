import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from './AppShell';

export function StudentLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const content = children ?? <Outlet />;

  return (
    <AppShell
      role="student"
      homePath="/student/projects"
      navItems={[
        {
          label: 'Projects',
          to: '/student/projects',
          active: location.pathname.startsWith('/student/projects'),
        },
      ]}
    >
      {content}
    </AppShell>
  );
}
