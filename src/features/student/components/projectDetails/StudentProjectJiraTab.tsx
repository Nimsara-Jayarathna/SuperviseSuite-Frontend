import { JiraHealthOverview } from '@/features/shared/jira/JiraHealthOverview';
import { studentApi } from '../../api/studentApi';
import type { StudentProjectDetail } from '../../types';

type StudentProjectJiraTabProps = {
  projectId: string | undefined;
  jira: StudentProjectDetail['jira'] | null | undefined;
};

export function StudentProjectJiraTab({ projectId, jira }: StudentProjectJiraTabProps) {
  return (
    <section className="space-y-4">
      {jira?.connected && projectId ? (
        <>
          <JiraHealthOverview
            fetcher={studentApi.getJiraHealth}
            sprintFetcher={studentApi.getJiraSprintProgress}
            workloadFetcher={studentApi.getJiraWorkload}
            hierarchyFetcher={studentApi.getProjectJiraHierarchy}
            projectId={projectId}
            workspaceName={jira.workspaceName}
            workspaceUrl={jira.workspaceUrl}
          />
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Jira workspace is not connected for this project. Ask your supervisor to connect it from
          the Integrations tab.
        </div>
      )}
    </section>
  );
}
