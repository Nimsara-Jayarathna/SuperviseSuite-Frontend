import { Card } from '@/components/ui/Card';

export function SupervisorProjectCardSkeleton() {
  return (
    <Card className="animate-pulse" padding="sm">
      <div className="grid min-h-[5.75rem] grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div>
          <div className="h-6 w-24 rounded-full bg-slate-200" />
          <div className="mt-3 h-6 w-2/3 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-full rounded bg-slate-100" />
          <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-14 rounded-2xl bg-slate-200" />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="min-h-16 rounded-2xl bg-slate-100" />
        <div className="min-h-16 rounded-2xl bg-slate-100" />
        <div className="min-h-16 rounded-2xl bg-slate-100" />
      </div>

      <div className="mt-3 h-10 rounded-2xl bg-slate-100" />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="h-10 rounded-2xl bg-slate-200" />
        <div className="h-10 rounded-2xl bg-slate-100" />
      </div>
    </Card>
  );
}
