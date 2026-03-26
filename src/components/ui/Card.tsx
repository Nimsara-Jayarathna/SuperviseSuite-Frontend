import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode } from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardSurface = 'default' | 'frosted';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  padding?: CardPadding;
  surface?: CardSurface;
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const SURFACE_CLASSES: Record<CardSurface, string> = {
  default: 'border border-border bg-white shadow-sm',
  frosted:
    'overflow-hidden border border-white/35 bg-white/55 backdrop-blur-md shadow-[0_18px_45px_rgba(15,23,42,0.14)]',
};

export function Card({
  children,
  className,
  padding = 'md',
  surface = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={cn('rounded-3xl', SURFACE_CLASSES[surface], PADDING_CLASSES[padding], className)}
      {...props}
    >
      {children ?? 'Card Placeholder'}
    </div>
  );
}
