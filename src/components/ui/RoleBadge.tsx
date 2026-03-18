import { cn } from '@/lib/cn';

type RoleValue = 'SUPERVISOR' | 'STUDENT' | 'supervisor' | 'student';

type RoleBadgeProps = {
  role: RoleValue;
  uppercase?: boolean;
  className?: string;
};

function normalizeRole(role: RoleValue): 'SUPERVISOR' | 'STUDENT' {
  return role.toUpperCase() === 'SUPERVISOR' ? 'SUPERVISOR' : 'STUDENT';
}

export function RoleBadge({ role, uppercase = false, className }: RoleBadgeProps) {
  const normalizedRole = normalizeRole(role);
  const isSupervisor = normalizedRole === 'SUPERVISOR';
  const label = isSupervisor ? 'Supervisor' : 'Student';
  const icon = isSupervisor ? '👑' : '🎓';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        isSupervisor ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700',
        uppercase ? 'tracking-[0.16em] uppercase' : '',
        className,
      )}
    >
      <span aria-hidden>{icon}</span>
      <span>{uppercase ? label.toUpperCase() : label}</span>
    </span>
  );
}
