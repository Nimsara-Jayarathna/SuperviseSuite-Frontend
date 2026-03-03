import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { StatusBadge } from './StatusBadge';

type NavItem = {
  label: string;
  to: string;
  active: boolean;
};

type TopBarProps = {
  role: 'student' | 'supervisor';
  homePath: string;
  navItems: NavItem[];
  primaryAction?: ReactNode;
  userName: string;
  userEmail: string;
  onLogout: () => void;
};

export function TopBar({
  role,
  homePath,
  navItems,
  primaryAction,
  userName,
  userEmail,
  onLogout,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link to={homePath} className="inline-flex items-center">
              <Logo size={38} showWordmark />
            </Link>
            <StatusBadge tone={role === 'student' ? 'student' : 'supervisor'}>
              {role === 'student' ? 'Student' : 'Supervisor'}
            </StatusBadge>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-1 lg:pl-8">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'rounded-2xl px-4 py-2 text-sm font-medium transition-colors',
                    item.active
                      ? role === 'student'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 text-white'
                      : 'bg-white text-muted-foreground hover:bg-slate-100 hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {primaryAction ? <div>{primaryAction}</div> : null}
              <div className="text-sm">
                <p className="font-medium text-foreground">{userName}</p>
                <p className="text-muted-foreground">{userEmail}</p>
              </div>
              <Button
                onClick={onLogout}
                className="rounded-2xl border-slate-200 bg-white px-4 py-2 text-sm text-foreground hover:bg-slate-100"
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
