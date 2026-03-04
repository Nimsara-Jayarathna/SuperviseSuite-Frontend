import { cn } from '@/lib/cn';

type StatusBadgeTone = 'student' | 'supervisor' | 'success' | 'warning' | 'danger' | 'neutral';

type StatusBadgeProps = {
  children: string;
  tone?: StatusBadgeTone;
  className?: string;
};

const TONE_CLASSES: Record<StatusBadgeTone, string> = {
  student: 'border-sky-200 bg-sky-50 text-sky-700',
  supervisor: 'border-amber-200 bg-amber-50 text-amber-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
};

export function StatusBadge({ children, tone = 'neutral', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
