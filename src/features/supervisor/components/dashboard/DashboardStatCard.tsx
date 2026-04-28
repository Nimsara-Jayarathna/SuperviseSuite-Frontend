import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

type DashboardStatTone = 'primary' | 'success' | 'info' | 'warning' | 'danger';

type ToneStyles = {
  accent: string;
  value: string;
};

const TONE_STYLES: Record<DashboardStatTone, ToneStyles> = {
  primary: {
    accent: 'border-l-2 border-l-primary/40',
    value: 'text-primary',
  },
  success: {
    accent: 'border-l-2 border-l-emerald-300',
    value: 'text-emerald-600',
  },
  info: {
    accent: 'border-l-2 border-l-sky-300',
    value: 'text-sky-600',
  },
  warning: {
    accent: 'border-l-2 border-l-amber-300',
    value: 'text-amber-600',
  },
  danger: {
    accent: 'border-l-2 border-l-rose-300',
    value: 'text-rose-600',
  },
};

export type DashboardStatCardProps = {
  label: string;
  value?: ReactNode;
  tone: DashboardStatTone;
  loading?: boolean;
};

export function DashboardStatCard({ label, value, tone, loading }: DashboardStatCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-2xl',
        styles.accent,
        loading ? 'animate-pulse' : null,
      )}
      padding="md"
    >
      <p className="h-10 text-xs font-medium uppercase leading-5 tracking-[0.2em] text-muted-foreground">
        {loading ? <span className="block h-3 w-24 rounded bg-slate-100" /> : label}
      </p>

      <p className={cn('mt-auto text-3xl font-semibold leading-none tabular-nums', styles.value)}>
        {loading ? <span className="block h-8 w-12 rounded bg-slate-200" /> : (value ?? 0)}
      </p>
    </Card>
  );
}
