import type { ReactNode } from 'react';
import { LandingPage } from '@/features/landing';
import { cn } from '@/lib/cn';

type AuthPageShellProps = {
  children: ReactNode;
  showBackdrop?: boolean;
  showDecorations?: boolean;
  containerClassName?: string;
};

export function AuthPageShell({
  children,
  showBackdrop = true,
  showDecorations = true,
  containerClassName,
}: AuthPageShellProps) {
  return (
    <>
      <LandingPage />
      {showBackdrop ? (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" aria-hidden="true" />
      ) : null}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          containerClassName,
        )}
      >
        {showDecorations ? (
          <>
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          </>
        ) : null}
        {children}
      </div>
    </>
  );
}
