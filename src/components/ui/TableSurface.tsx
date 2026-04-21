import type { ReactNode } from 'react';

type TableSurfaceProps = {
  children: ReactNode;
};

export function TableSurface({ children }: TableSurfaceProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
