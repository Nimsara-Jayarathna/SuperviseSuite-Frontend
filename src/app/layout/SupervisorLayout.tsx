import type { ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { tokenStorage } from '@/services/tokenStorage';

export function SupervisorLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = tokenStorage.getUser();
  const content = children ?? <Outlet />;

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Supervisor';

  function handleLogout() {
    tokenStorage.clearAll();
    navigate('/');
  }

  const navItems = [
    {
      label: 'Dashboard',
      to: '/supervisor/dashboard',
      active: location.pathname === '/supervisor/dashboard',
    },
    {
      label: 'Projects',
      to: '/supervisor/projects',
      active: location.pathname.startsWith('/supervisor/projects'),
    },
    {
      label: 'New Project',
      to: '/supervisor/projects/new',
      active: location.pathname === '/supervisor/projects/new',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 h-96 w-96 rounded-full bg-sky-100/70 blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/supervisor/dashboard" className="inline-flex items-center">
              <Logo size={38} showWordmark />
            </Link>
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-amber-700">
              SUPERVISOR
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center lg:justify-between">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'rounded-2xl px-4 py-2 text-sm font-medium transition-colors',
                    item.active
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-muted-foreground hover:bg-slate-100 hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="text-sm">
                <p className="font-medium text-foreground">{fullName}</p>
                <p className="text-muted-foreground">
                  {user?.email ?? 'supervisor@supervisesuite.app'}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                className="rounded-2xl border-slate-200 bg-white px-4 py-2 text-sm text-foreground hover:bg-slate-100"
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{content}</main>
    </div>
  );
}
