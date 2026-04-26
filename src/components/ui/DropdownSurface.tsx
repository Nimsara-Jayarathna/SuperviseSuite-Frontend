import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

type DropdownSurfaceProps = HTMLAttributes<HTMLUListElement> & {
  children: ReactNode;
  style: CSSProperties;
};

export const DropdownSurface = forwardRef<HTMLUListElement, DropdownSurfaceProps>(
  ({ className, style, children, ...rest }, ref) => {
    return (
      <ul
        {...rest}
        ref={ref}
        className={cn(
          'overflow-auto rounded-xl border border-border bg-white p-1 shadow-lg',
          className,
        )}
        style={style}
      >
        {children}
      </ul>
    );
  },
);

DropdownSurface.displayName = 'DropdownSurface';
