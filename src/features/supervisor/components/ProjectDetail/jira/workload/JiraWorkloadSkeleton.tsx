export function JiraWorkloadSkeleton() {
  return (
    <section className="space-y-4" aria-label="Loading team workload">
      {/* Banner skeleton */}
      <div className="h-16 w-full animate-pulse rounded-2xl bg-slate-100" />

      {/* Chart and Card skeleton */}
      <div className="grid gap-4 lg:grid-cols-[1fr_250px]">
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      {/* Table skeleton */}
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
    </section>
  );
}
