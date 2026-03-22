import { CalendarDays, Clock3, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageTabs } from '@/components/ui/PageTabs';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { CommitActivitySection } from '@/features/projects/components/CommitActivitySection';
import { ProjectDetailsSkeleton } from '../components/ProjectDetailsSkeleton';
import { MilestonesTabSection } from '../components/ProjectDetail/MilestonesTabSection';
import { OverviewTabSection } from '../components/ProjectDetail/OverviewTabSection';
import { TeamTabSection } from '../components/ProjectDetail/TeamTabSection';
import { useProjectDetailsPageState } from '../hooks/useProjectDetailsPageState';
import { useSupervisorProject } from '../hooks/useSupervisorProject';
import { supervisorApi } from '../api/supervisorApi';
import { isApiException } from '@/services/apiClient';
import {
  LIFECYCLE_OPTIONS,
  TABS,
  dateFormatter,
  dateTimeFormatter,
  toTabLabel,
} from '../projectDetails.shared';
import type { SupervisorProjectDetailTab, SupervisorProjectLifecycle } from '../types';

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project: loadedProject, isLoading, error, reload } = useSupervisorProject(projectId);
  const { project, overview, team, milestones, requestModal, actions } = useProjectDetailsPageState(
    {
      projectId,
      loadedProject,
    },
  );
  const [isRefreshingGitHub, setIsRefreshingGitHub] = useState(false);
  const hasHandledGithubSetupRef = useRef(false);
  const [refreshRequestModal, setRefreshRequestModal] = useState<{
    isOpen: boolean;
    status: 'loading' | 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });
  const loadActivityPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubActivityPage(projectId, page);
    },
    [projectId],
  );
  const loadContributorsPage = useCallback(
    (page: number) => {
      if (!projectId) {
        return Promise.resolve({ items: [], hasMore: false, page, size: 10 });
      }
      return supervisorApi.getProjectGitHubContributorsPage(projectId, page);
    },
    [projectId],
  );

  async function handleGitHubRefresh() {
    if (!projectId) {
      return;
    }

    setIsRefreshingGitHub(true);
    setRefreshRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Refreshing GitHub data',
      message: 'Syncing latest repository metadata, commits, and contributors.',
    });
    try {
      await supervisorApi.refreshProjectGitHub(projectId);
      await reload();
      setRefreshRequestModal({
        isOpen: true,
        status: 'success',
        title: 'GitHub data refreshed',
        message: 'Latest GitHub data was synced and loaded successfully.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to refresh GitHub data right now. Please try again.';
      setRefreshRequestModal({
        isOpen: true,
        status: 'error',
        title: 'GitHub refresh failed',
        message,
      });
    } finally {
      setIsRefreshingGitHub(false);
    }
  }

  function closeRefreshRequestModal() {
    setRefreshRequestModal((current) => ({ ...current, isOpen: false }));
  }

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const githubSetup = searchParams.get('githubSetup');
    if (!githubSetup || hasHandledGithubSetupRef.current) {
      return;
    }

    hasHandledGithubSetupRef.current = true;

    if (githubSetup === 'success') {
      void (async () => {
        setIsRefreshingGitHub(true);
        setRefreshRequestModal({
          isOpen: true,
          status: 'loading',
          title: 'Finalizing GitHub setup',
          message: 'Syncing repository data after GitHub App connection.',
        });

        try {
          await supervisorApi.refreshProjectGitHub(projectId);
          await reload();
          setRefreshRequestModal({
            isOpen: true,
            status: 'success',
            title: 'GitHub connected',
            message: 'GitHub App connected and project activity synced successfully.',
          });
        } catch (error) {
          const message = isApiException(error)
            ? error.apiError.message
            : 'GitHub was connected, but initial sync failed. Please try refresh again.';
          setRefreshRequestModal({
            isOpen: true,
            status: 'error',
            title: 'GitHub sync failed',
            message,
          });
        } finally {
          setIsRefreshingGitHub(false);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('githubSetup');
          setSearchParams(nextParams, { replace: true });
        }
      })();
      return;
    }

    if (githubSetup === 'failed') {
      setRefreshRequestModal({
        isOpen: true,
        status: 'error',
        title: 'GitHub setup failed',
        message: 'GitHub App connection did not complete. Please try connecting again.',
      });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('githubSetup');
      setSearchParams(nextParams, { replace: true });
    }
  }, [projectId, reload, searchParams, setSearchParams]);

  const requestedTab = searchParams.get('tab') as SupervisorProjectDetailTab | null;
  const activeTab = requestedTab && TABS.includes(requestedTab) ? requestedTab : 'overview';

  function handleTabChange(tab: SupervisorProjectDetailTab) {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', tab);
    }
    setSearchParams(nextParams, { replace: true });
  }

  if (isLoading) return <ProjectDetailsSkeleton />;

  if (error) {
    if (error.code === 'NOT_FOUND') {
      return (
        <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Project not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested supervisor project could not be found or is not available to your account.
          </p>
          <Link
            to="/supervisor/projects"
            className={buttonStyles({ variant: 'primary', size: 'md', className: 'mt-6' })}
          >
            Back to projects
          </Link>
        </div>
      );
    }
    return <ErrorState error={error} onRetry={() => void reload()} />;
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <RequestStateModal
        isOpen={requestModal.state.isOpen}
        status={requestModal.state.status}
        title={requestModal.state.title}
        message={requestModal.state.message}
        onClose={requestModal.state.status === 'loading' ? undefined : requestModal.close}
        onRetry={requestModal.state.status === 'error' ? requestModal.retryLastRequest : undefined}
      />
      <RequestStateModal
        isOpen={refreshRequestModal.isOpen}
        status={refreshRequestModal.status}
        title={refreshRequestModal.title}
        message={refreshRequestModal.message}
        onClose={refreshRequestModal.status === 'loading' ? undefined : closeRefreshRequestModal}
        onRetry={
          refreshRequestModal.status === 'error' ? () => void handleGitHubRefresh() : undefined
        }
      />

      <PageHeader
        title={project.title}
        subtitle={project.summary ?? 'No summary has been recorded for this project yet.'}
      />

      <section className="flex flex-wrap gap-3">
        <label className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm shadow-sm">
          <select
            value={actions.quickLifecycleStatus}
            onChange={(e) =>
              actions.handleQuickStatusChange(e.target.value as SupervisorProjectLifecycle)
            }
            disabled={actions.isUpdatingStatus}
            className="bg-transparent font-semibold tracking-[0.08em] text-foreground outline-none"
          >
            {LIFECYCLE_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <CalendarDays className="h-4 w-4" />
          {project.milestoneDate
            ? `Milestone ${dateFormatter.format(new Date(project.milestoneDate))}`
            : 'Milestone not set'}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <Users className="h-4 w-4" />
          {project.members.length} team member{project.members.length === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
          <Clock3 className="h-4 w-4" />
          Progress {project.progressPercent ?? 0}%
        </span>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Batch', value: project.batch ?? 'Not set' },
          { label: 'Semester', value: project.semester ?? 'Not set' },
          { label: 'Milestones', value: String(project.milestones.length) },
          {
            label: 'Last Activity',
            value: project.lastActivityAt
              ? dateTimeFormatter.format(new Date(project.lastActivityAt))
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

      <PageTabs
        items={TABS.map((tab) => ({ value: tab, label: toTabLabel(tab) }))}
        value={activeTab}
        onChange={(value) => handleTabChange(value as SupervisorProjectDetailTab)}
        tone="supervisor"
      />

      {activeTab === 'overview' ? (
        <OverviewTabSection
          project={project}
          overview={overview}
          onProjectUpdate={actions.handleProjectUpdate}
        />
      ) : null}

      {activeTab === 'team' ? <TeamTabSection project={project} team={team} /> : null}

      {activeTab === 'milestones' ? (
        <MilestonesTabSection project={project} milestones={milestones} />
      ) : null}

      {activeTab === 'github' ? (
        <CommitActivitySection
          isLoading={isLoading}
          error={null}
          data={project.github}
          onRetry={() => void reload()}
          loadActivityPage={loadActivityPage}
          loadContributorsPage={loadContributorsPage}
          canRefresh
          isRefreshing={isRefreshingGitHub}
          onRefresh={() => void handleGitHubRefresh()}
          onNavigateToOverview={() => handleTabChange('overview')}
        />
      ) : null}
    </div>
  );
}
