import { Crown, GraduationCap, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getRoleLabel, normalizeUserRole, type RoleInput, ROLES } from '@/types/roles';

type RoleBadgeProps = {
  role: RoleInput;
  uppercase?: boolean;
  className?: string;
};

type RoleBadgeConfig = {
  icon: LucideIcon;
  className: string;
};

const ROLE_CONFIG: Record<(typeof ROLES)[keyof typeof ROLES], RoleBadgeConfig> = {
  [ROLES.SUPERVISOR]: {
    icon: Crown,
    className: 'bg-indigo-100 text-indigo-700',
  },
  [ROLES.STUDENT]: {
    icon: GraduationCap,
    className: 'bg-slate-100 text-slate-700',
  },
};

export function RoleBadge({ role, uppercase = false, className }: RoleBadgeProps) {
  const normalizedRole = normalizeUserRole(role);
  const config = ROLE_CONFIG[normalizedRole];
  const Icon = config.icon;
  const label = getRoleLabel(normalizedRole, uppercase);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold',
        config.className,
        uppercase ? 'tracking-[0.16em] uppercase' : '',
        className,
      )}
    >
      <Icon aria-hidden size={14} strokeWidth={2.25} className="-translate-y-px shrink-0" />
      <span>{label}</span>
    </span>
  );
}
