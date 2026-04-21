import { StatusBadge } from '@/components/ui/StatusBadge';
import type { StudentProjectLifecycle } from '../../types';
import { getLifecycleTone } from '../../utils/projectDetails/presentation';

type StudentProjectDetailsHeaderProps = {
  title: string;
  summary: string | null;
  lifecycleStatus: StudentProjectLifecycle;
};

export function StudentProjectDetailsHeader({
  title,
  summary,
  lifecycleStatus,
}: StudentProjectDetailsHeaderProps) {
  return (
    <section className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p
          className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {summary ?? 'No summary has been recorded for this project yet.'}
        </p>
      </div>
      <div className="inline-flex shrink-0 items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Lifecycle
          </span>
          <div className="mt-0.5">
            <StatusBadge
              tone={getLifecycleTone(lifecycleStatus)}
              className="border-none bg-transparent p-0 text-[13px] font-black uppercase tracking-tight"
            >
              {lifecycleStatus.replace('_', ' ')}
            </StatusBadge>
          </div>
        </div>
      </div>
    </section>
  );
}
