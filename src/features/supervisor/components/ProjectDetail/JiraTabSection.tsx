import { supervisorApi } from '../../api/supervisorApi';
import type { SupervisorProjectDetail } from '../../types';
import { JiraHealthOverview } from './jira/JiraHealthOverview';

type JiraTabSectionProps = {
  project: SupervisorProjectDetail;
};

export function JiraTabSection({ project }: JiraTabSectionProps) {
  const jira = project.jira;

  return (
    <section>
      {jira?.connected ? (
        <JiraHealthOverview
          fetcher={supervisorApi.getJiraHealth}
          sprintFetcher={supervisorApi.getJiraSprintProgress}
          workloadFetcher={supervisorApi.getJiraWorkload}
          syncer={supervisorApi.refreshProjectJira}
          projectId={project.id}
          workspaceName={jira.workspaceName}
          workspaceUrl={jira.workspaceUrl}
        />
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Jira workspace is not connected for this project. Connect it from the Integrations tab.
        </div>
      )}
    </section>
  );
}
