import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useJiraWorkload } from '../../../../hooks/useJiraWorkload';
import type { JiraWorkload } from '../../../../types';
import { JiraWorkloadImbalanceBanner } from './JiraWorkloadImbalanceBanner';
import { JiraWorkloadBarChart } from './JiraWorkloadBarChart';
import { JiraWorkloadTable } from './JiraWorkloadTable';
import { JiraWorkloadUnassignedCard } from './JiraWorkloadUnassignedCard';
import { JiraWorkloadSkeleton } from './JiraWorkloadSkeleton';

type JiraWorkloadPanelProps = {
  fetcher: (projectId: string) => Promise<JiraWorkload>;
  projectId: string;
};

export function JiraWorkloadPanel({ fetcher, projectId }: JiraWorkloadPanelProps) {
  const { workload, isLoading, error, reload } = useJiraWorkload(fetcher, projectId);

  if (isLoading) {
    return <JiraWorkloadSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  if (!workload || workload.members.length === 0) {
    return (
      <EmptyState
        title="No workload data available"
        description="There are no Jira issues assigned to any team members in this project yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 border-t border-slate-200 pt-4 w-full">
        <div className="inline-flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-wide text-slate-900">Team Workload</h2>
        </div>
        <p className="text-sm text-slate-600">Distribution of work across all members</p>
      </div>

      <JiraWorkloadImbalanceBanner workload={workload} />

      <div className="grid gap-4 lg:grid-cols-[1fr_min-content]">
        <JiraWorkloadBarChart workload={workload} />
        {workload.unassignedCount > 0 && (
          <div className="min-w-[240px]">
            <JiraWorkloadUnassignedCard workload={workload} />
          </div>
        )}
      </div>

      <JiraWorkloadTable workload={workload} />
    </div>
  );
}
