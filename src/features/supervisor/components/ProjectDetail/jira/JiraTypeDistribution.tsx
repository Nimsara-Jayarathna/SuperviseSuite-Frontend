import type { JiraHealth } from '@/features/supervisor/types';

type JiraTypeDistributionProps = {
  health: JiraHealth;
};

// Bar colours — cycled for each type
const BAR_COLORS = [
  '#6366F1', // indigo-500
  '#06B6D4', // cyan-500
  '#8B5CF6', // violet-500
  '#F59E0B', // amber-400
  '#10B981', // emerald-500
  '#F43F5E', // rose-500
];

function truncate(s: string, max = 20): string {
  return s.length > max ? `${s.slice(0, max)}\u2026` : s;
}

export function JiraTypeDistribution({ health }: JiraTypeDistributionProps) {
  // Show up to 6 types, sorted descending by count
  const items = [...health.typeDistribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (items.length === 0) {
    return (
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
          Issue types
        </p>
        <p className="mt-4 text-center text-sm text-slate-500">No issue type data</p>
      </div>
    );
  }

  const maxCount = Math.max(...items.map((i) => i.count), 1);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
        Issue types
      </p>

      <div className="mt-4 space-y-2.5" aria-label="Issue type distribution bar chart" role="img">
        {items.map((item, index) => {
          const color = BAR_COLORS[index % BAR_COLORS.length];
          const width = (item.count / maxCount) * 100;
          const share = total > 0 ? (item.count / total) * 100 : 0;

          return (
            <article
              key={`${item.type}-${index}`}
              className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-slate-800">{truncate(item.type)}</p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">
                  {item.count}{' '}
                  <span className="text-xs font-medium text-slate-600">({Math.round(share)}%)</span>
                </p>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
