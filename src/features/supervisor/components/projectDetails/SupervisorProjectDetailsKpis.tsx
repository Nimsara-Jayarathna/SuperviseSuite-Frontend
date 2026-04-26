type SupervisorProjectDetailsKpisProps = {
  batch: string | null;
  semester: string | null;
  milestonesCount: number;
  progressPercent: number | null;
};

export function SupervisorProjectDetailsKpis({
  batch,
  semester,
  milestonesCount,
  progressPercent,
}: SupervisorProjectDetailsKpisProps) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Batch', value: batch ?? 'Not set' },
        { label: 'Semester', value: semester ?? 'Not set' },
        { label: 'Milestones', value: String(milestonesCount) },
        { label: 'Progress', value: `${progressPercent ?? 0}%` },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
      ))}
    </section>
  );
}
