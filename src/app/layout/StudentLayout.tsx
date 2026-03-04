import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { AppShell } from './AppShell';

export function StudentLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const content = children ?? <Outlet />;

  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Student';
  const userEmail = user?.email ?? 'student@supervisesuite.app';

  return (
    <AppShell
      role="student"
      homePath="/student/projects"
      userName={userName}
      userEmail={userEmail}
      onLogout={logout}
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
