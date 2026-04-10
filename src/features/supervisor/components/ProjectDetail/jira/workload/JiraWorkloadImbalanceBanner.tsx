import { AlertTriangle } from 'lucide-react';
import type { JiraWorkload } from '../../../../types';

type JiraWorkloadImbalanceBannerProps = {
  workload: JiraWorkload;
};

export function JiraWorkloadImbalanceBanner({ workload }: JiraWorkloadImbalanceBannerProps) {
  if (!workload.imbalanceDetected || !workload.imbalanceMessage) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-200/60 bg-gradient-to-r from-rose-50/80 to-orange-50/80 px-5 py-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
      {/* Decorative gradient blur in background */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-rose-400/10 blur-2xl" />

      <div className="relative flex items-start gap-4 sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm shadow-rose-100 ring-1 ring-rose-100">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold tracking-tight text-rose-900">
            Workload Imbalance Detected
          </h3>
          <p className="mt-0.5 text-sm font-medium text-rose-700/90 leading-relaxed">
            {workload.imbalanceMessage}
          </p>
        </div>

        {/* Decorative subtle pulse indicator */}
        <div className="hidden sm:flex shrink-0 items-center justify-center">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-20"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500 shadow-sm shadow-rose-300"></span>
          </span>
        </div>
      </div>
    </div>
  );
}
