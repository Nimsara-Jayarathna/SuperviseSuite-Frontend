import { JiraTabSection } from './JiraTabSection';
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
  return (
    <div className="space-y-6">
      <RepositorySection
        project={project}
        onUpdate={onProjectUpdate}
        pendingSourceId={pendingGitHubSourceId}
        pendingFlowType={pendingGitHubFlowType}
        onPendingSourceHandled={onPendingGitHubSourceHandled}
      />
      <JiraTabSection
        project={project}
        onConnectJira={onConnectJira}
        onDisconnectJira={onDisconnectJira}
        isConnectingJira={isConnectingJira}
        isDisconnectingJira={isDisconnectingJira}
      />
    </div>
  );
}
