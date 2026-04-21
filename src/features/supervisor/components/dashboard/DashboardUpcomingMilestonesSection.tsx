import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { UPCOMING_WINDOW_DAYS } from '../../utils/dashboard/constants';
import type { UpcomingMilestoneItem } from '../../utils/dashboard/scoring';
import { upcomingWindowClasses, upcomingWindowLabel } from '../../utils/dashboard/scoring';
import { formatMilestoneDate, jiraIndicatorLabel } from '../../utils/dashboard/presentation';

type DashboardUpcomingMilestonesSectionProps = {
  isLoading: boolean;
  upcomingProjects: UpcomingMilestoneItem[];
};

export function DashboardUpcomingMilestonesSection({
  isLoading,
  upcomingProjects,
}: DashboardUpcomingMilestonesSectionProps) {
  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Upcoming milestones</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Showing overdue items and milestones due within the next {UPCOMING_WINDOW_DAYS} days.
      </p>
      {isLoading ? (
        <div className="mt-5 space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`upcoming-skeleton-${index}`} className="h-16 rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : upcomingProjects.length > 0 ? (
        <div className="mt-5 space-y-4">
          {upcomingProjects.map((item) => (
            <div
              key={item.project.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-foreground sm:text-base">
                    {item.project.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatMilestoneDate(item.project.milestoneDate)}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${upcomingWindowClasses(item.daysUntilMilestone)}`}
                >
                  {upcomingWindowLabel(item.daysUntilMilestone)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
                  {item.project.lifecycleStatus.replace('_', ' ')}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
                  Jira {jiraIndicatorLabel(item.project.jiraHealthIndicator)}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
                  {item.project.progressPercent ?? 0}% progress
                </span>
              </div>

              <div className="mt-3">
                <Link
                  to={`/supervisor/projects/${item.project.id}`}
                  className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                >
                  Review milestone
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          No overdue or near-term milestones in the current window.
        </p>
      )}
    </div>
  );
}
