import type { ReactNode } from 'react';

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />
      {children ?? 'Public Layout Placeholder'}
    </div>
  );
}
