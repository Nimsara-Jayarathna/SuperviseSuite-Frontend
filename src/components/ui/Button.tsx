import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'link'
  | 'default'
  | 'nav'
  | 'nav-primary'
  | 'hero'
  | 'hero-outline';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

/**
 * BUTTON STYLE CONTRACT
 * - Use `primary` for the main action on a screen, `secondary`/`outline` for supporting actions,
 *   `ghost` for subtle utility actions, `danger` for destructive actions, and `link` for text-only actions.
 * - `Button.tsx` is the only source of truth for button colors, borders, hover, active, and focus states.
 * - Page-level usage may only add layout classes (for example `w-full`, `justify-start`, `mt-2`), not color classes.
 */
const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
  secondary:
    'border border-slate-200 bg-white text-foreground hover:bg-slate-50 active:bg-slate-100',
  outline: 'border border-slate-300 bg-white text-foreground hover:bg-slate-50 active:bg-slate-100',
  ghost: 'bg-transparent text-muted-foreground hover:bg-slate-100 hover:text-foreground',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
  link: 'rounded-none bg-transparent px-0 text-sky-700 hover:text-sky-800 hover:underline focus:ring-0',
  default: 'border border-slate-200 bg-white text-foreground hover:bg-slate-50',
  nav: 'bg-transparent text-muted-foreground hover:bg-slate-100 hover:text-foreground',
  'nav-primary': 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
  hero: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
  'hero-outline':
    'border border-slate-200 bg-white text-foreground hover:bg-slate-50 active:bg-slate-100',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm sm:text-base',
};

type ButtonStylesOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function buttonStyles({
  variant = 'default',
  size = 'md',
  className,
}: ButtonStylesOptions = {}) {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

export function Button({
  variant = 'default',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({
        variant,
        size,
        className: cn(fullWidth && 'w-full', className),
      })}
      {...props}
    >
      {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  );
}
