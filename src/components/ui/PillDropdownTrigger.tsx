import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

type PillDropdownTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon?: ReactNode;
  label: ReactNode;
  isOpen: boolean;
  widthPx?: number;
};

export const PillDropdownTrigger = forwardRef<HTMLButtonElement, PillDropdownTriggerProps>(
  ({ icon, label, isOpen, disabled, className, widthPx, style, ...rest }, ref) => {
    const mergedStyle: CSSProperties | undefined =
      widthPx != null ? { ...style, width: widthPx } : style;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center overflow-hidden rounded-2xl bg-slate-100 transition-all focus-visible:outline-none',
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:ring-2 hover:ring-indigo-100',
          className,
        )}
        style={mergedStyle}
        {...rest}
      >
        <span className="grid w-full grid-cols-[16px_1fr_16px] items-center gap-2 px-3 py-1.5">
          <span className="flex h-4 w-4 items-center justify-center">{icon ?? null}</span>
          <span className="inline-flex min-w-0 items-center justify-center justify-self-center text-center leading-none">
            {label}
          </span>
          <span
            aria-hidden
            className={cn(
              'flex h-4 w-4 items-center justify-center transition-transform duration-150',
              isOpen && 'rotate-180',
            )}
          >
            <svg className="h-3 w-3 text-slate-400" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </button>
    );
  },
);

PillDropdownTrigger.displayName = 'PillDropdownTrigger';
