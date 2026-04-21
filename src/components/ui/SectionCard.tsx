import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type SectionCardProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, subtitle, actions, children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">{title}</h2>
          {subtitle ? <div className="text-xs font-medium text-slate-400">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
