import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'nav'
  | 'nav-primary'
  | 'hero'
  | 'hero-outline';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: 'border border-slate-200 bg-white text-foreground hover:bg-slate-50',
  primary: 'bg-sky-600 text-white hover:bg-sky-700',
  secondary: 'border border-slate-200 bg-white text-foreground hover:bg-slate-50',
  ghost: 'bg-transparent text-muted-foreground hover:bg-slate-100 hover:text-foreground',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  hero: 'bg-sky-600 text-white hover:bg-sky-700',
  'hero-outline': 'border border-slate-200 bg-white text-foreground hover:bg-slate-50',
  nav: 'bg-transparent text-muted-foreground hover:bg-slate-100 hover:text-foreground',
  'nav-primary': 'bg-sky-600 text-white hover:bg-sky-700',
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
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
