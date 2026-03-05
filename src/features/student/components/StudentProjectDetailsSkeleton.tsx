export function StudentProjectDetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <section className="space-y-3">
        <div className="h-10 w-1/3 rounded bg-slate-200" />
        <div className="h-5 w-2/3 rounded bg-slate-100" />
      </section>

      <section className="flex flex-wrap gap-3">
        <div className="h-10 w-28 rounded-full bg-slate-200" />
        <div className="h-10 w-40 rounded-full bg-slate-100" />
        <div className="h-10 w-32 rounded-full bg-slate-100" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`student-project-detail-metric-skeleton-${index}`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-8 w-24 rounded bg-slate-200" />
          </div>
        ))}
      </section>

      <section className="h-12 rounded-3xl bg-white" />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="mt-5 space-y-3">
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-32 rounded bg-slate-200" />
          <div className="mt-5 space-y-3">
            <div className="h-16 rounded-2xl bg-slate-100" />
            <div className="h-16 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </section>
    </div>
  );
}
