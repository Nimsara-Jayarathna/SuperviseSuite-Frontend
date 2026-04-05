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
    accent === 'red'
      ? 'text-red-600'
      : accent === 'amber'
        ? 'text-amber-600'
        : 'text-slate-800';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
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
