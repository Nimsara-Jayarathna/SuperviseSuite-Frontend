import { cn } from '@/lib/cn';

type BlockingStateProps = {
  isActive: boolean;
  message?: string;
  mode?: 'inline' | 'overlay';
  className?: string;
};

export function BlockingState({
  isActive,
  message = 'Loading...',
  mode = 'inline',
  className,
}: BlockingStateProps) {
  if (!isActive) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 text-sm font-medium text-foreground',
        mode === 'overlay' &&
          'absolute inset-0 z-20 rounded-3xl border-0 bg-white/85 backdrop-blur-[1px]',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      <span>{message}</span>
    </div>
  );
}
