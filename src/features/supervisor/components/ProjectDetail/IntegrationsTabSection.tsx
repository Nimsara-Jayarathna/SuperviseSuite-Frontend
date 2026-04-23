import { ExternalLink, KanbanSquare, Link2 } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { LastSyncedBadge } from '@/components/ui/LastSyncedBadge';
import { normalizeSyncStatus } from '@/lib/syncStatus';
import { RepositorySection } from './RepositorySection';
import type { SupervisorProjectDetail } from '../../types';

type IntegrationsTabSectionProps = {
  project: SupervisorProjectDetail;
  onProjectUpdate: (updatedProject: SupervisorProjectDetail) => void;
  onConnectJira: () => Promise<void>;
  onDisconnectJira: () => Promise<void>;
  isConnectingJira: boolean;
  isDisconnectingJira: boolean;
  pendingGitHubSourceId?: string | null;
  pendingGitHubFlowType?: 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED' | null;
  onPendingGitHubSourceHandled?: () => void;
};

export function IntegrationsTabSection({
  project,
  onProjectUpdate,
  onConnectJira,
  onDisconnectJira,
  isConnectingJira,
  isDisconnectingJira,
  pendingGitHubSourceId,
  pendingGitHubFlowType,
  onPendingGitHubSourceHandled,
}: IntegrationsTabSectionProps) {
  const jira = project.jira;
  const jiraSyncing = normalizeSyncStatus(jira?.syncStatus) === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      <RepositorySection
        project={project}
        onUpdate={onProjectUpdate}
        pendingSourceId={pendingGitHubSourceId}
        pendingFlowType={pendingGitHubFlowType}
        onPendingSourceHandled={onPendingGitHubSourceHandled}
      />

      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Jira integration</h2>
          <div className="flex items-center gap-2">
            {jira?.connected ? (
              <button
                type="button"
                className={buttonStyles({
                  variant: jiraSyncing ? 'secondary' : 'danger',
                  size: 'sm',
                })}
                disabled={isDisconnectingJira || jiraSyncing}
                onClick={() => void onDisconnectJira()}
                title={
                  jiraSyncing ? 'Cannot disconnect while Jira sync is in progress.' : undefined
                }
              >
                {isDisconnectingJira
                  ? 'Disconnecting...'
                  : jiraSyncing
                    ? 'Syncing...'
                    : 'Disconnect'}
              </button>
            ) : (
              <button
                type="button"
                className={buttonStyles({ variant: 'primary', size: 'sm', className: 'gap-1.5' })}
                disabled={isConnectingJira}
                onClick={() => void onConnectJira()}
              >
                <KanbanSquare className="h-3.5 w-3.5" />
                {isConnectingJira ? 'Redirecting...' : 'Link Jira Project'}
              </button>
            )}
          </div>
        </div>

        {jira?.connected ? (
          <article className="mt-4 rounded-2xl border border-border/70 bg-slate-50/50 p-4 transition-colors hover:border-border">
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-12 sm:gap-4">
              <div className="flex min-w-0 items-center gap-1.5 hover:text-foreground sm:col-span-5">
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                {jira.workspaceUrl ? (
                  <a
                    href={jira.workspaceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-slate-700 hover:underline"
                    title={jira.workspaceUrl}
                  >
                    <span className="truncate">{jira.workspaceName ?? 'Workspace'}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="truncate font-medium text-slate-700">
                    {jira.workspaceName ?? 'Workspace'}
                  </span>
                )}
              </div>
              <div className="flex min-w-0 items-center sm:col-span-4">
                <span className="truncate">
                  Integration: <span className="font-medium text-slate-700">Atlassian OAuth</span>
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 sm:col-span-3 sm:justify-end">
                <LastSyncedBadge lastSyncedAt={jira.lastSyncedAt} />
              </div>
            </div>
          </article>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Status: <span className="font-medium text-slate-800">No workspace connected</span>
            </p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              Not connected
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
