import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
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
      primaryAction={
        <Link
          to="/supervisor/projects/new"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + New Project
        </Link>
      }
    >
      {content}
    </AppShell>
  );
}
