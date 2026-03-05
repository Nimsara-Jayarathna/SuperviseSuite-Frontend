export function StudentProjectCardSkeleton() {
  return (
    <article className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-6 w-20 rounded-full bg-slate-100" />
      <div className="mt-3 h-6 w-2/3 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-full rounded bg-slate-100" />
      <div className="mt-1 h-4 w-5/6 rounded bg-slate-100" />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="h-16 rounded-2xl bg-slate-100" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-10 flex-1 rounded-2xl bg-slate-200" />
        <div className="h-10 flex-1 rounded-2xl bg-slate-100" />
      </div>
    </article>
  );
}
