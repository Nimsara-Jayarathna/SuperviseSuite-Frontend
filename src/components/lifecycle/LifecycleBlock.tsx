import type { ReactNode } from 'react';

type LifecycleBlockProps = {
  control: ReactNode;
};

export function LifecycleBlock({ control }: LifecycleBlockProps) {
  return (
    <div className="flex flex-col items-end gap-2">
      <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        LIFECYCLE
      </span>
      {control}
    </div>
  );
}
