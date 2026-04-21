import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { upcomingWindowLabel, type AttentionItem } from '../../utils/dashboard/scoring';
import { jiraIndicatorLabel } from '../../utils/dashboard/presentation';

type DashboardAttentionSectionProps = {
  isLoading: boolean;
  attentionProjects: AttentionItem[];
};

export function DashboardAttentionSection({
  isLoading,
  attentionProjects,
}: DashboardAttentionSectionProps) {
  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Projects needing attention</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ranked by lifecycle risk, Jira signal, milestone pressure, and recent activity.
      </p>
      {isLoading ? (
        <div className="mt-5 space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`attention-skeleton-${index}`} className="h-20 rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : attentionProjects.length > 0 ? (
        <div className="mt-5 space-y-4">
          {attentionProjects.map((item) => {
            const toneClasses =
              item.severity === 'critical'
                ? 'border-rose-200 bg-rose-50/60'
                : 'border-amber-200 bg-amber-50/60';
            const iconClasses = item.severity === 'critical' ? 'text-rose-600' : 'text-amber-600';
            const signalPillClasses =
              item.severity === 'critical'
                ? 'border-rose-200 bg-rose-100 text-rose-700'
                : 'border-amber-200 bg-amber-100 text-amber-700';
            return (
              <div key={item.project.id} className={`rounded-2xl border p-4 ${toneClasses}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{item.project.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.summaryText}</p>
                  </div>
                  <AlertTriangle className={`mt-1 h-5 w-5 shrink-0 ${iconClasses}`} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${signalPillClasses}`}
                  >
                    {item.severity === 'critical' ? 'Critical' : 'Needs review'}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {item.project.lifecycleStatus.replace('_', ' ')}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    Jira {jiraIndicatorLabel(item.project.jiraHealthIndicator)}
                  </span>
                  {item.daysUntilMilestone !== null ? (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {upcomingWindowLabel(item.daysUntilMilestone)}
                    </span>
                  ) : null}
                  {item.inactivityDays !== null ? (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {item.inactivityDays}d inactivity
                    </span>
                  ) : null}
                </div>

                {item.reasons.length > 0 ? (
                  <p className="mt-3 text-sm text-slate-600">{item.reasons.join(' ')}</p>
                ) : null}

                <div className="mt-3">
                  <Link
                    to={`/supervisor/projects/${item.project.id}`}
                    className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                  >
                    Open project
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          No projects currently need urgent attention.
        </p>
      )}
    </div>
  );
}
