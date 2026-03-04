import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode } from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  padding?: CardPadding;
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-white shadow-sm',
        PADDING_CLASSES[padding],
        className,
      )}
      {...props}
    >
      {children ?? 'Card Placeholder'}
    </div>
  );
}
