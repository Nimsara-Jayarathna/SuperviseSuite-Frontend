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
      to: '/supervisor',
      active: location.pathname === '/supervisor' || location.pathname === '/supervisor/dashboard',
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:flex-row lg:gap-6 lg:px-8">
        <aside className="w-full shrink-0 rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur lg:sticky lg:top-6 lg:w-72 lg:self-start">
          <div className="flex items-center justify-between gap-3 lg:block">
            <Link to="/supervisor" className="inline-flex items-center">
              <Logo size={38} showWordmark />
            </Link>
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-amber-700">
              SUPERVISOR
            </span>
          </div>

          <nav className="mt-6 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-muted-foreground hover:bg-slate-100 hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-foreground">{fullName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.email ?? 'supervisor@supervisesuite.app'}
            </p>
          </div>

          <Button
            onClick={handleLogout}
            className="mt-4 w-full rounded-2xl border-slate-200 bg-white px-4 py-2.5 text-sm text-foreground hover:bg-slate-100"
          >
            Log out
          </Button>
        </aside>

        <main className="mt-6 min-w-0 flex-1 lg:mt-0">{content}</main>
      </div>
    </div>
  );
}
