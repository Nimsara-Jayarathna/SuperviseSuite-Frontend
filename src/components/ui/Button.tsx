import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'hero' | 'hero-outline' | 'nav' | 'nav-primary' | 'default';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    'rounded-md border border-border bg-background px-4 py-2 font-medium text-foreground hover:bg-muted transition-colors',
  hero: 'rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity',
  'hero-outline':
    'rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors',
  nav: 'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent',
  'nav-primary':
    'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function Button({ variant = 'default', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button className={cn(VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)} {...props} />
  );
}
