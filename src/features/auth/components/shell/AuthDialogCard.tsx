import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type AuthDialogCardProps = {
  title?: string;
  subtitle?: ReactNode;
  onClose?: () => void;
  closeAriaLabel?: string;
  children: ReactNode;
  className?: string;
};

export function AuthDialogCard({
  title,
  subtitle,
  onClose,
  closeAriaLabel = 'Close',
  children,
  className,
}: AuthDialogCardProps) {
  return (
    <section
      className={cn(
        'relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl',
        className,
      )}
    >
      {onClose ? (
        <Button
          type="button"
          onClick={onClose}
          aria-label={closeAriaLabel}
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 h-7 w-7 rounded-full p-0"
        >
          ✕
        </Button>
      ) : null}

      {title || subtitle ? (
        <div className={cn('mb-6 flex flex-col items-center gap-2', onClose ? 'mt-4' : undefined)}>
          {title ? <h1 className="text-xl font-bold text-foreground">{title}</h1> : null}
          {subtitle ? (
            <div className="text-center text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}

