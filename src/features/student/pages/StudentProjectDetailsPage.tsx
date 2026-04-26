import { useCallback, useMemo } from 'react';
import { ProjectOverviewContent } from '@/features/projects/components/ProjectOverviewContent';
import { useMeetingAnalytics } from '@/features/projects/hooks/useMeetingAnalytics';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { PageTabs } from '@/components/ui/PageTabs';
import { StudentProjectDetailsSkeleton } from '../components/StudentProjectDetailsSkeleton';
import { StudentProjectDetailsKpis } from '../components/projectDetails/StudentProjectDetailsKpis';
import { ProjectHeroCard } from '@/components/ui/ProjectHeroCard';
import { LifecycleStatus } from '@/components/lifecycle';
import { StudentProjectGitHubTab } from '../components/projectDetails/StudentProjectGitHubTab';
import { StudentProjectJiraTab } from '../components/projectDetails/StudentProjectJiraTab';
import { StudentProjectMilestonesTab } from '../components/projectDetails/StudentProjectMilestonesTab';
import { StudentProjectTeamTab } from '../components/projectDetails/StudentProjectTeamTab';
import { useStudentProject } from '../hooks/useStudentProject';
import { useStudentProjectDetailsBlockingError } from '../hooks/projectDetails/useStudentProjectDetailsBlockingError';
import { useStudentProjectDetailsTabs } from '../hooks/projectDetails/useStudentProjectDetailsTabs';
import { studentApi } from '../api/studentApi';
import { isBlockingError } from '@/utils/errorSeverity';
import { StudentFilesTabSection } from '../components/StudentFilesTabSection';
import { StudentMeetingsTabSection } from '../components/StudentMeetingsTabSection';
import type { StudentProjectDetailTab } from '../types';

function toTabLabel(tab: string) {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

export function StudentProjectDetailsPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tabs, activeTab, setActiveTab } = useStudentProjectDetailsTabs(
    searchParams,
    setSearchParams,
  );
  const { project, isLoading, error, reload } = useStudentProject(projectId);
  const jira = project?.jira ?? null;
  const retryLoad = useCallback(() => {
    void reload();
  }, [reload]);
  const meetingFetchers = useMemo(
    () => ({
      getMeetingChannels: studentApi.getProjectMeetingChannels,
      getMeetingRecords: studentApi.getProjectMeetingRecords,
    }),
    [],
  );
  const meetingAnalytics = useMeetingAnalytics(project?.id, meetingFetchers);

  useStudentProjectDetailsBlockingError({ error, onRetry: retryLoad });

  if (isLoading) {
    return <StudentProjectDetailsSkeleton />;
  }

  if (error) {
    if (isBlockingError(error)) {
      return null;
    }

    if (error.code === 'NOT_FOUND') {
      return (
        <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Project not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The requested student project could not be found or is not assigned to your account.
          </p>
          <Link
            to="/student/projects"
            className={buttonStyles({ variant: 'primary', size: 'md', className: 'mt-6' })}
          >
            Back to projects
          </Link>
        </div>
      );
    }

    return <ErrorState error={error} onRetry={() => void reload()} />;
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ProjectHeroCard
        title={project.title}
        subtitle={project.summary ?? 'No summary has been recorded for this project yet.'}
        rightSlot={<LifecycleStatus value={project.status} canEdit={false} />}
        kpiSlot={
          <StudentProjectDetailsKpis
            batch={project.batch}
            semester={project.semester}
            milestonesCount={project.milestones.length}
            progressPercent={project.progressPercent}
          />
        }
      />

      <PageTabs
        items={tabs.map((tab) => ({
          value: tab,
          label: toTabLabel(tab),
        }))}
        value={activeTab}
        onChange={(value) => setActiveTab(value as StudentProjectDetailTab)}
        tone="neutral"
      />

      {activeTab === 'overview' ? (
        <ProjectOverviewContent
          project={project}
          role="student"
          meetingAnalytics={meetingAnalytics}
        />
      ) : null}

      {activeTab === 'team' ? (
        <StudentProjectTeamTab members={project.members} leaderId={project.leader?.id ?? null} />
      ) : null}

      {activeTab === 'milestones' ? (
        <StudentProjectMilestonesTab milestones={project.milestones} />
      ) : null}

      {activeTab === 'files' ? (
        <StudentFilesTabSection projectId={project.id} initialFiles={project.files} />
      ) : null}

      {activeTab === 'github' ? (
        <StudentProjectGitHubTab
          projectId={projectId}
          projectGithubView={project.github ?? null}
          githubRepositories={project.githubRepositories}
          isPageLoading={isLoading}
          onRetryReloadProject={() => void reload()}
        />
      ) : null}

      {activeTab === 'jira' ? <StudentProjectJiraTab projectId={projectId} jira={jira} /> : null}

      {activeTab === 'meetings' && projectId ? (
        <StudentMeetingsTabSection projectId={projectId} />
      ) : null}
    </div>
  );
}
