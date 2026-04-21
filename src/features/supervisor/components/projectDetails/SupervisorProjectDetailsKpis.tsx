import { dateTimeFormatter } from '../../projectDetails.shared';

type SupervisorProjectDetailsKpisProps = {
  batch: string | null;
  semester: string | null;
  milestonesCount: number;
  lastActivityAt: string | null;
};

export function SupervisorProjectDetailsKpis({
  batch,
  semester,
  milestonesCount,
  lastActivityAt,
}: SupervisorProjectDetailsKpisProps) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        { label: 'Batch', value: batch ?? 'Not set' },
        { label: 'Semester', value: semester ?? 'Not set' },
        { label: 'Milestones', value: String(milestonesCount) },
        {
          label: 'Last Activity',
          value: lastActivityAt
            ? dateTimeFormatter.format(new Date(lastActivityAt))
            : 'Not recorded',
          small: true,
        },
      ].map(({ label, value, small }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className={`mt-2 font-semibold text-foreground ${small ? 'text-sm' : 'text-2xl'}`}>
            {value}
          </p>
        </div>
      ))}
    </section>
  );
}
