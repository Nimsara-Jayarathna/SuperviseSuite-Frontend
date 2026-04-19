import { Menu, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { cn } from '@/lib/cn';
import type { UserRoleLower } from '@/types/roles';

type NavItem = {
  label: string;
  to: string;
  active: boolean;
};

type PublicAction = {
  label: string;
  onClick: () => void;
  variant: 'ghost' | 'primary';
};

type PrivateTopBarProps = {
  mode?: 'private';
  role: UserRoleLower;
  homePath: string;
  navItems: NavItem[];
  userName: string;
  onOpenAccount: () => void;
};

type PublicTopBarProps = {
  mode: 'public';
  homePath: string;
  actions: PublicAction[];
};

type TopBarProps = PrivateTopBarProps | PublicTopBarProps;

export function TopBar(props: TopBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  if (props.mode === 'public') {
    return (
      <>
        <header className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white/85 backdrop-blur md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link to={props.homePath} className="inline-flex items-center">
              <Logo size={38} showWordmark />
            </Link>

            <div className="flex items-center gap-2">
              {props.actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  size="md"
                  className="font-medium"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
            <Link to={props.homePath} className="inline-flex items-center">
              <Logo size={34} showWordmark />
            </Link>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {props.actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  size="md"
                  className="font-medium max-[420px]:h-9 max-[420px]:px-3"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </header>
      </>
    );
  }

  const { role, homePath, navItems, userName, onOpenAccount } = props;
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <>
      <header className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white/85 backdrop-blur md:block">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link to={homePath} className="inline-flex items-center">
                <Logo size={38} showWordmark />
              </Link>
              <RoleBadge role={role} uppercase />
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
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-muted-foreground hover:bg-slate-100 hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <button
                type="button"
                onClick={onOpenAccount}
                className="inline-flex items-center gap-3 self-start rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50 sm:self-auto"
                aria-label="Open account menu"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                  {userInitial}
                </span>
                <span className="text-sm font-semibold text-foreground">{userName}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur md:hidden">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to={homePath} className="inline-flex items-center">
                <Logo size={34} showWordmark />
              </Link>
              <RoleBadge role={role} uppercase />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAccount}
                aria-label="Open account menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div
            className={cn(
              'mt-3 border-t border-slate-200/90 pt-3',
              isMobileMenuOpen ? 'block' : 'hidden',
            )}
          >
            <nav className="grid gap-2">
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
          </div>
        </div>
      </header>
    </>
  );
}
