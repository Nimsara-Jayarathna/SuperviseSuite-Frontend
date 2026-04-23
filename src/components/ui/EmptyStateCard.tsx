import type { ReactNode } from 'react';

type EmptyStateCardProps = {
  message: ReactNode;
  action?: ReactNode;
};

export function EmptyStateCard({ message, action }: EmptyStateCardProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
      <p className="text-sm font-semibold text-slate-500">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
