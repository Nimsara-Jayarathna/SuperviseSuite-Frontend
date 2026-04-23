import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type AuthDialogCardProps = {
  headerVariant?: 'page' | 'modal';
  title?: string;
  subtitle?: ReactNode;
  onClose?: () => void;
  closeAriaLabel?: string;
  children: ReactNode;
  className?: string;
  tabIndex?: number;
};

export const AuthDialogCard = forwardRef<HTMLElement, AuthDialogCardProps>(function AuthDialogCard(
  {
    headerVariant = 'page',
    title,
    subtitle,
    onClose,
    closeAriaLabel = 'Close',
    children,
    className,
    tabIndex,
  },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn(
        'relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl',
        className,
      )}
      tabIndex={tabIndex}
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
        headerVariant === 'modal' ? (
          <div className="mb-4 pr-8">
            {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
            {subtitle ? <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div> : null}
          </div>
        ) : (
          <div
            className={cn('mb-6 flex flex-col items-center gap-2', onClose ? 'mt-4' : undefined)}
          >
            {title ? <h1 className="text-xl font-bold text-foreground">{title}</h1> : null}
            {subtitle ? (
              <div className="text-center text-sm text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
        )
      ) : null}

      {children}
    </section>
  );
});
