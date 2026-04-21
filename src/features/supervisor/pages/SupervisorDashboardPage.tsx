import { useCallback } from 'react';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { isBlockingError } from '@/utils/errorSeverity';
import { useSupervisorDashboard } from '../hooks/useSupervisorDashboard';
import { DashboardAttentionSection } from '../components/dashboard/DashboardAttentionSection';
import { DashboardProjectHealthSection } from '../components/dashboard/DashboardProjectHealthSection';
import { DashboardSearchInput } from '../components/dashboard/DashboardSearchInput';
import { DashboardStatsSection } from '../components/dashboard/DashboardStatsSection';
import { DashboardUpcomingMilestonesSection } from '../components/dashboard/DashboardUpcomingMilestonesSection';
import { useSupervisorDashboardBlockingError } from '../hooks/dashboard/useSupervisorDashboardBlockingError';
import { useSupervisorDashboardViewModel } from '../hooks/dashboard/useSupervisorDashboardViewModel';

export function SupervisorDashboardPage() {
  const { dashboard, isLoading, error, reload } = useSupervisorDashboard();
  const viewModel = useSupervisorDashboardViewModel(dashboard);
  const retryLoad = useCallback(() => {
    void reload();
  }, [reload]);

  useSupervisorDashboardBlockingError({ error, onRetry: retryLoad });

  if (error) {
    if (isBlockingError(error)) {
      return null;
    }
    return <ErrorState error={error} onRetry={() => void reload()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Dashboard"
        subtitle="Monitor delivery health across every supervised project."
        actions={<DashboardSearchInput query={viewModel.query} onChange={viewModel.setQuery} />}
      />

      <DashboardStatsSection dashboard={dashboard} isLoading={isLoading} />

      <DashboardProjectHealthSection
        isLoading={isLoading}
        visibleProjects={viewModel.visibleProjects}
        pagedProjects={viewModel.pagedProjects}
        pageSize={viewModel.pageSize}
        safeCurrentPage={viewModel.safeCurrentPage}
        totalPages={viewModel.totalPages}
        pagingStateHandlers={{ setCurrentPage: viewModel.setCurrentPage }}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        <DashboardAttentionSection
          isLoading={isLoading}
          attentionProjects={viewModel.attentionProjects}
        />
        <DashboardUpcomingMilestonesSection
          isLoading={isLoading}
          upcomingProjects={viewModel.upcomingProjects}
        />
      </section>
    </div>
  );
}
