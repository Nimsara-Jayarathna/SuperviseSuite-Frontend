import { ExternalLink, KanbanSquare, Link2, RefreshCw } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import type { SupervisorProjectDetail } from '../../types';

type JiraTabSectionProps = {
  project: SupervisorProjectDetail;
  onConnectJira: () => Promise<void>;
  onDisconnectJira: () => Promise<void>;
  isConnectingJira: boolean;
  isDisconnectingJira: boolean;
};

export function JiraTabSection({
  project,
  onConnectJira,
  onDisconnectJira,
  isConnectingJira,
  isDisconnectingJira,
}: JiraTabSectionProps) {
  const jira = project.jira;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Jira integration</h2>
          <div className="flex items-center gap-2">
            {project.jira?.connected ? (
              <button
                type="button"
                className={buttonStyles({ variant: 'danger', size: 'sm' })}
                disabled={isDisconnectingJira}
                onClick={() => void onDisconnectJira()}
              >
                {isDisconnectingJira ? 'Disconnecting...' : 'Disconnect'}
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
                <RefreshCw className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="truncate font-medium text-emerald-700">Workspace connected</span>
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
      </div>
    </section>
  );
}
