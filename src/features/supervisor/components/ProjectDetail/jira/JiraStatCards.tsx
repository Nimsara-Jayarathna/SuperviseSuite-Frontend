import type { JiraHealth } from '@/features/supervisor/types';

type JiraStatCardsProps = {
  health: JiraHealth;
};

type StatCardProps = {
  label: string;
  value: string;
  accent?: 'neutral' | 'amber' | 'red';
};

function StatCard({ label, value, accent = 'neutral' }: StatCardProps) {
  const valueColor =
    accent === 'red' ? 'text-red-600' : accent === 'amber' ? 'text-amber-600' : 'text-slate-900';

  const cardTone =
    accent === 'red'
      ? 'border-red-200 bg-red-50/50'
      : accent === 'amber'
        ? 'border-amber-200 bg-amber-50/50'
        : 'border-slate-200 bg-white';

  const railTone = accent === 'red' ? 'bg-red-500' : accent === 'amber' ? 'bg-amber-500' : null;

  const statusLabel = accent === 'red' ? 'Critical' : accent === 'amber' ? 'Watch' : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${cardTone}`}
    >
      {railTone ? <div className={`absolute inset-y-0 left-0 w-1 ${railTone}`} /> : null}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</p>
        {statusLabel ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${accent === 'red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
    </div>
  );
}

export function JiraStatCards({ health }: JiraStatCardsProps) {
  const completionText = `${health.completionPercent.toFixed(1)}%`;

  const overdueAccent: StatCardProps['accent'] =
    health.overdueIssues > 5 ? 'red' : health.overdueIssues > 0 ? 'amber' : 'neutral';

  const priorityAccent: StatCardProps['accent'] =
    health.highPriorityOpen > 3 ? 'red' : health.highPriorityOpen > 0 ? 'amber' : 'neutral';

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Completion" value={completionText} />
      <StatCard label="Open issues" value={String(health.openIssues)} />
      <StatCard label="Overdue" value={String(health.overdueIssues)} accent={overdueAccent} />
      <StatCard
        label="High priority open"
        value={String(health.highPriorityOpen)}
        accent={priorityAccent}
      />
    </div>
  );
}
