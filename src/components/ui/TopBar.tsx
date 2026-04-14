import { Link } from 'react-router-dom';
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
  if (props.mode === 'public') {
    return (
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
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
    );
  }

  const { role, homePath, navItems, userName, onOpenAccount } = props;
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
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
  );
}
