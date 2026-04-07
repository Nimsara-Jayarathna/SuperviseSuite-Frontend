/**
 * Pulse skeleton shown while Jira health data is loading.
 *
 * Layout mirrors JiraHealthOverview:
 *   - 4 stat cards (same grid as JiraStatCards)
 *   - Bug ratio bar placeholder
 *   - Two chart placeholders (donut + bar chart) side by side
 */
export function JiraHealthSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Stat cards row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`jira-stat-skeleton-${i}`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="h-2.5 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-7 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Bug ratio bar */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-16 rounded bg-slate-100" />
          <div className="h-4 w-10 rounded bg-slate-200" />
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100" />
      </div>

      {/* Chart placeholders */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Donut placeholder */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="mx-auto mt-5 h-32 w-32 rounded-full bg-slate-100" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`jira-legend-skeleton-${i}`} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <div className="h-2.5 flex-1 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart placeholder */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`jira-bar-skeleton-${i}`} className="space-y-1">
                <div className="h-2.5 w-20 rounded bg-slate-100" />
                <div
                  className="h-3 rounded-full bg-slate-200"
                  style={{ width: `${65 - i * 12}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
