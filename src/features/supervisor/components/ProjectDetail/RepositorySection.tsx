import { useEffect, useMemo, useState } from 'react';
import { buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { GithubDetailsModal } from '@/features/projects/components/GithubDetailsModal';
import { isApiException } from '@/services/apiClient';
import { Github, RefreshCw } from 'lucide-react';
import { supervisorApi } from '../../api/supervisorApi';
import { useAvailableRepositories } from '../../hooks/useAvailableRepositories';
import { useGitHubSetupFlow } from '../../hooks/useGitHubSetupFlow';
import { useProjectRepositories } from '../../hooks/useProjectRepositories';
import { useRepositorySelection } from '../../hooks/useRepositorySelection';
import type {
  GitHubRepositoryOption,
  ProjectGitHubRepositories,
  SupervisorProjectDetail,
} from '../../types';
import {
  RepositoryLinkModalContent,
  type RepositoryLinkMethod,
} from './RepositoryLinkModalContent';
import {
  RepositoryManagementModalContent,
  type RepositoryManagementRow,
} from './RepositoryManagementModalContent';

type RepositorySectionProps = {
  project: SupervisorProjectDetail;
  onUpdate: (updatedProject: SupervisorProjectDetail) => void;
  pendingSourceId?: string | null;
  pendingFlowType?: 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED' | null;
  onPendingSourceHandled?: () => void;
};

const GITHUB_REPOSITORY_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

type ModalStep = 'method' | 'repository-selection';
type RepositorySelectionEntryMode = 'manual' | 'callback-direct' | 'callback-requested';

type RequestModalState = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
};

function toSyncLabel(value: string | null | undefined): string {
  if (value === 'SUCCESS') return 'Synced';
  if (value === 'FAILED') return 'Sync failed';
  if (value === 'PENDING') return 'Pending';
  return 'Unknown';
}

function toSourceLabel(source: ProjectGitHubRepositories['accessSources'][number]): string {
  return `${source.ownerLogin} (${source.accessType})`;
}

function isValidRepositoryUrl(value: string): boolean {
  return GITHUB_REPOSITORY_URL_PATTERN.test(value.trim());
}

export function RepositorySection({
  project,
  onUpdate,
  pendingSourceId,
  pendingFlowType,
  onPendingSourceHandled,
}: RepositorySectionProps) {
  const {
    data: repositoriesData,
    isLoading: isLoadingRepositoriesData,
    error: repositoriesDataError,
    reload: reloadRepositoriesData,
  } = useProjectRepositories(project.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<RepositoryLinkMethod | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectionEntryMode, setSelectionEntryMode] = useState<RepositorySelectionEntryMode>('manual');

  const [publicRepositoryUrl, setPublicRepositoryUrl] = useState('');
  const [publicCustomName, setPublicCustomName] = useState('');

  const [isSubmittingPublicRepository, setIsSubmittingPublicRepository] = useState(false);
  const [isCreatingAccessRequest, setIsCreatingAccessRequest] = useState(false);
  const [isConfirmingRepositorySelection, setIsConfirmingRepositorySelection] = useState(false);
  const [isMutatingLinks, setIsMutatingLinks] = useState(false);
  const [isAccessRequestLinkCopied, setIsAccessRequestLinkCopied] = useState(false);
  const [generatedAccessRequestUrl, setGeneratedAccessRequestUrl] = useState<string | null>(null);
  const [generatedAccessRequestExpiresAt, setGeneratedAccessRequestExpiresAt] = useState<
    string | null
  >(null);
  const [inventoryBySourceId, setInventoryBySourceId] = useState<
    Record<string, GitHubRepositoryOption[]>
  >({});
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [requestModal, setRequestModal] = useState<RequestModalState>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });

  const {
    isStartingOwnerInstall,
    startOwnerInstall,
  } = useGitHubSetupFlow(project.id);

  const {
    data: availableRepositoriesData,
    isLoading: isLoadingAvailableRepositories,
    error: availableRepositoriesError,
    reload: reloadAvailableRepositories,
  } = useAvailableRepositories(modalStep === 'repository-selection' ? selectedSourceId : null);

  const linkedRepositories = repositoriesData?.repositories ?? [];
  const accessSources = repositoriesData?.accessSources ?? [];
  const maxLinkedRepositories = repositoriesData?.maxLinkedRepositories ?? 5;
  const remainingSlots = Math.max(0, maxLinkedRepositories - linkedRepositories.length);

  const managementRows = useMemo<RepositoryManagementRow[]>(() => {
    const sourceById = new Map(accessSources.map((source) => [source.id, source]));
    const linkedByRepoId = new Map(linkedRepositories.map((repository) => [repository.githubRepoId, repository]));
    const rowsByKey = new Map<string, RepositoryManagementRow>();

    for (const source of accessSources) {
      const items = inventoryBySourceId[source.id] ?? [];
      for (const item of items) {
        const linked = linkedByRepoId.get(item.githubRepoId) ?? null;
        const rowKey = `${source.id}:${item.githubRepoId}`;
        rowsByKey.set(rowKey, {
          rowKey,
          sourceId: source.id,
          accessType: source.accessType,
          githubRepositoryId: item.id,
          githubRepoId: item.githubRepoId,
          linkId: linked?.id ?? null,
          enabled: Boolean(linked),
          primary: Boolean(linked?.primary),
          customName: linked?.customName ?? null,
          fullName: item.fullName ?? linked?.fullName ?? null,
          ownerLogin: item.ownerLogin ?? linked?.ownerLogin ?? null,
          url: item.url ?? linked?.url ?? null,
          syncStatus: linked?.syncStatus ?? null,
        });
      }
    }

    for (const linked of linkedRepositories) {
      const source = linked.sourceId ? sourceById.get(linked.sourceId) ?? null : null;
      const rowKey = linked.sourceId
        ? `${linked.sourceId}:${linked.githubRepoId}`
        : `linked:${linked.id}`;
      if (rowsByKey.has(rowKey)) {
        continue;
      }
      rowsByKey.set(rowKey, {
        rowKey,
        sourceId: linked.sourceId ?? null,
        accessType: source?.accessType ?? 'UNKNOWN',
        githubRepositoryId: linked.githubRepositoryId,
        githubRepoId: linked.githubRepoId,
        linkId: linked.id,
        enabled: true,
        primary: Boolean(linked.primary),
        customName: linked.customName,
        fullName: linked.fullName,
        ownerLogin: linked.ownerLogin,
        url: linked.url,
        syncStatus: linked.syncStatus,
      });
    }

    return Array.from(rowsByKey.values()).sort((a, b) => {
      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }
      return (a.fullName ?? '').localeCompare(b.fullName ?? '');
    });
  }, [accessSources, inventoryBySourceId, linkedRepositories]);

  const selection = useRepositorySelection(remainingSlots > 0 ? remainingSlots : 0);

  const sourceById = useMemo(() => {
    return new Map(accessSources.map((source) => [source.id, source]));
  }, [accessSources]);

  const selectedSource = selectedSourceId ? sourceById.get(selectedSourceId) ?? null : null;

  useEffect(() => {
    if (!pendingSourceId) {
      return;
    }

    setIsModalOpen(true);
    setModalStep('repository-selection');
    setSelectedMethod(
      pendingFlowType === 'INSTALLATION_REQUESTED' ? 'INSTALLATION_REQUESTED' : 'INSTALLATION_DIRECT',
    );
    setSelectedSourceId(pendingSourceId);
    setSelectionEntryMode(
      pendingFlowType === 'INSTALLATION_REQUESTED' ? 'callback-requested' : 'callback-direct',
    );
    selection.clear();
    onPendingSourceHandled?.();
  }, [onPendingSourceHandled, pendingFlowType, pendingSourceId, selection.clear]);

  useEffect(() => {
    if (!isModalOpen) {
      setPublicRepositoryUrl('');
      setPublicCustomName('');
      setGeneratedAccessRequestUrl(null);
      setGeneratedAccessRequestExpiresAt(null);
      setIsAccessRequestLinkCopied(false);
      setSelectedMethod(null);
      setSelectedSourceId(null);
      setSelectionEntryMode('manual');
      setModalStep('method');
      selection.clear();
    }
  }, [isModalOpen, selection.clear]);

  async function loadRepositoryInventory() {
    setIsLoadingInventory(true);
    setInventoryError(null);
    try {
      const entries = await Promise.all(
        accessSources.map(async (source) => {
          const response = await supervisorApi.getAvailableGitHubRepositories(source.id);
          return [source.id, response.items] as const;
        }),
      );
      setInventoryBySourceId(Object.fromEntries(entries));
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to load repository inventory for this project.';
      setInventoryError(message);
    } finally {
      setIsLoadingInventory(false);
    }
  }

  useEffect(() => {
    if (!isManagementModalOpen) {
      return;
    }
    void loadRepositoryInventory();
  }, [accessSources, isManagementModalOpen]);

  async function reloadProjectAndRepositories(projectId: string) {
    await reloadRepositoriesData();
    const updatedProject = await supervisorApi.getProjectById(projectId, true);
    onUpdate(updatedProject);
  }

  function openRequestModal(
    status: RequestModalState['status'],
    title: string,
    message: string,
  ) {
    setRequestModal({ isOpen: true, status, title, message });
  }

  function closeRequestModal() {
    setRequestModal((current) => ({ ...current, isOpen: false }));
  }

  async function handleSubmitPublicRepository() {
    const repositoryUrl = publicRepositoryUrl.trim();
    if (!isValidRepositoryUrl(repositoryUrl)) {
      openRequestModal('error', 'Invalid repository URL', 'Enter a valid https://github.com/owner/repo URL.');
      return;
    }

    if (remainingSlots < 1) {
      openRequestModal(
        'error',
        'Repository limit reached',
        'Unlink an existing repository before adding another one.',
      );
      return;
    }

    setIsSubmittingPublicRepository(true);
    openRequestModal('loading', 'Linking public repository', 'Creating access source and linking repository.');

    try {
      const created = await supervisorApi.createPublicGitHubAccessSource(project.id, repositoryUrl);
      const repository = created.items[0];
      if (!repository) {
        throw new Error('No repository returned from public access source creation.');
      }

      await supervisorApi.linkGitHubRepositories({
        projectId: project.id,
        sourceId: created.sourceId,
        repositories: [
          {
            githubRepositoryId: repository.id,
            customName: publicCustomName.trim() || undefined,
            primary: linkedRepositories.length === 0,
          },
        ],
      });

      await reloadProjectAndRepositories(project.id);
      setIsModalOpen(false);
      openRequestModal('success', 'Repository linked', 'Public repository linked successfully.');
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to link public repository right now.';
      openRequestModal('error', 'Repository link failed', message);
    } finally {
      setIsSubmittingPublicRepository(false);
    }
  }

  async function handleCreateAccessRequest() {
    setIsCreatingAccessRequest(true);
    setGeneratedAccessRequestUrl(null);
    setGeneratedAccessRequestExpiresAt(null);

    try {
      const response = await supervisorApi.createGitHubAccessSourceRequest(project.id);
      const absoluteUrl = new URL(response.requestUrl, window.location.origin).toString();
      setGeneratedAccessRequestUrl(absoluteUrl);
      setGeneratedAccessRequestExpiresAt(response.expiresAt ?? null);
      setIsAccessRequestLinkCopied(false);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to generate access request link right now.';
      openRequestModal('error', 'Request link generation failed', message);
    } finally {
      setIsCreatingAccessRequest(false);
    }
  }

  async function handleCopyAccessRequestUrl() {
    if (!generatedAccessRequestUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedAccessRequestUrl);
      setIsAccessRequestLinkCopied(true);
      window.setTimeout(() => setIsAccessRequestLinkCopied(false), 1200);
    } catch {
      setIsAccessRequestLinkCopied(false);
      openRequestModal('error', 'Copy failed', 'Unable to copy link automatically.');
    }
  }

  async function handleStartOwnerInstall() {
    try {
      await startOwnerInstall();
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : error instanceof Error
          ? error.message
          : 'Unable to start GitHub install flow right now.';
      openRequestModal('error', 'GitHub install start failed', message);
    }
  }

  async function handleConfirmRepositorySelection() {
    if (!selectedSourceId) {
      openRequestModal('error', 'Missing access source', 'Select a valid access source and try again.');
      return;
    }

    if (selection.selectionsPayload.length === 0) {
      openRequestModal('error', 'No repositories selected', 'Select at least one repository.');
      return;
    }

    setIsConfirmingRepositorySelection(true);
    openRequestModal('loading', 'Linking repositories', 'Saving selected repositories for this project.');

    try {
      await supervisorApi.linkGitHubRepositories({
        projectId: project.id,
        sourceId: selectedSourceId,
        repositories: selection.selectionsPayload,
      });
      await reloadProjectAndRepositories(project.id);
      setIsModalOpen(false);
      openRequestModal('success', 'Repositories linked', 'Selected repositories were linked successfully.');
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to link repositories right now.';
      openRequestModal('error', 'Repository linking failed', message);
    } finally {
      setIsConfirmingRepositorySelection(false);
    }
  }

  async function handleSelectPrimary(linkId: string) {
    setIsMutatingLinks(true);
    openRequestModal('loading', 'Selecting repository', 'Setting selected repository as primary.');
    try {
      await supervisorApi.selectPrimaryGitHubRepository(linkId);
      await reloadProjectAndRepositories(project.id);
      openRequestModal('success', 'Primary repository updated', 'GitHub tab now tracks the selected repository.');
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to select repository right now.';
      openRequestModal('error', 'Repository selection failed', message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleRefreshRepository(linkId: string) {
    setIsMutatingLinks(true);
    openRequestModal('loading', 'Refreshing repository', 'Syncing repository metadata, commits, and contributors.');
    try {
      await supervisorApi.refreshGitHubRepository(linkId);
      await reloadProjectAndRepositories(project.id);
      openRequestModal('success', 'Repository refreshed', 'Repository sync completed.');
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to refresh repository right now.';
      openRequestModal('error', 'Repository refresh failed', message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleUnlinkRepository(linkId: string) {
    setIsMutatingLinks(true);
    openRequestModal('loading', 'Unlinking repository', 'Removing repository from this project.');
    try {
      await supervisorApi.unlinkGitHubRepository(linkId);
      await reloadProjectAndRepositories(project.id);
      openRequestModal('success', 'Repository unlinked', 'Repository was removed from this project.');
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to unlink repository right now.';
      openRequestModal('error', 'Repository unlink failed', message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleDisconnectAccessSource(sourceId: string) {
    setIsMutatingLinks(true);
    openRequestModal('loading', 'Disconnecting access source', 'Removing source access and linked repositories from this project.');
    try {
      await supervisorApi.disconnectGitHubAccessSource(sourceId);
      await reloadProjectAndRepositories(project.id);
      openRequestModal(
        'success',
        'Access source disconnected',
        'GitHub access source and related project links were removed.',
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to disconnect access source right now.';
      openRequestModal('error', 'Access source disconnect failed', message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleEnableRepository(row: RepositoryManagementRow) {
    if (!row.sourceId || !row.githubRepositoryId) {
      openRequestModal(
        'error',
        'Repository enable failed',
        'Repository source details are missing. Reload and try again.',
      );
      return;
    }
    if (remainingSlots < 1) {
      openRequestModal(
        'error',
        'Repository limit reached',
        'Unlink an existing repository before enabling another one.',
      );
      return;
    }

    setIsMutatingLinks(true);
    openRequestModal('loading', 'Enabling repository', 'Linking repository to this project.');
    try {
      await supervisorApi.linkGitHubRepositories({
        projectId: project.id,
        sourceId: row.sourceId,
        repositories: [
          {
            githubRepositoryId: row.githubRepositoryId,
            primary: linkedRepositories.length === 0,
          },
        ],
      });
      await reloadProjectAndRepositories(project.id);
      openRequestModal('success', 'Repository enabled', 'Repository is now linked to this project.');
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to enable repository right now.';
      openRequestModal('error', 'Repository enable failed', message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        onClose={requestModal.status === 'loading' ? undefined : closeRequestModal}
      />

      <GithubDetailsModal isOpen={isModalOpen} title="Link repositories" onClose={() => setIsModalOpen(false)}>
        <RepositoryLinkModalContent
          step={modalStep}
          repositorySelectionEntryMode={selectionEntryMode}
          canReturnToMethods={selectionEntryMode === 'manual'}
          selectedMethod={selectedMethod}
          onSelectMethod={setSelectedMethod}
          onBackToMethods={() => {
            if (selectionEntryMode !== 'manual') {
              return;
            }
            setModalStep('method');
            setSelectedSourceId(null);
            setSelectionEntryMode('manual');
          }}
          publicRepositoryUrl={publicRepositoryUrl}
          publicCustomName={publicCustomName}
          onChangePublicRepositoryUrl={setPublicRepositoryUrl}
          onChangePublicCustomName={setPublicCustomName}
          onSubmitPublicRepository={() => void handleSubmitPublicRepository()}
          isSubmittingPublicRepository={isSubmittingPublicRepository}
          onStartOwnerInstall={() => void handleStartOwnerInstall()}
          isStartingOwnerInstall={isStartingOwnerInstall}
          onCreateAccessRequest={() => void handleCreateAccessRequest()}
          isCreatingAccessRequest={isCreatingAccessRequest}
          generatedAccessRequestUrl={generatedAccessRequestUrl}
          generatedAccessRequestExpiresAt={generatedAccessRequestExpiresAt}
          onCopyAccessRequestUrl={() => void handleCopyAccessRequestUrl()}
          isAccessRequestLinkCopied={isAccessRequestLinkCopied}
          selectedSourceLabel={selectedSource ? toSourceLabel(selectedSource) : null}
          availableRepositories={availableRepositoriesData?.items ?? []}
          isLoadingAvailableRepositories={isLoadingAvailableRepositories}
          availableRepositoriesError={availableRepositoriesError?.message ?? null}
          onReloadAvailableRepositories={() => void reloadAvailableRepositories()}
          selectedRepositoryIds={selection.selectedRepositoryIds}
          primaryRepositoryId={selection.primaryRepositoryId}
          customNameByRepositoryId={selection.customNameByRepositoryId}
          maxSelectableCount={remainingSlots}
          onToggleRepository={selection.toggleRepository}
          onSetPrimaryRepository={selection.setPrimaryRepositoryId}
          onCustomNameChange={selection.setCustomName}
          onConfirmRepositorySelection={() => void handleConfirmRepositorySelection()}
          isConfirmingRepositorySelection={isConfirmingRepositorySelection}
        />
      </GithubDetailsModal>

      <GithubDetailsModal
        isOpen={isManagementModalOpen}
        title="Manage repositories"
        onClose={() => setIsManagementModalOpen(false)}
      >
        <RepositoryManagementModalContent
          rows={managementRows}
          linkedCount={linkedRepositories.length}
          maxLinkedRepositories={maxLinkedRepositories}
          remainingSlots={remainingSlots}
          isMutating={isMutatingLinks}
          isLoadingInventory={isLoadingInventory}
          inventoryError={inventoryError}
          onReloadInventory={() => void loadRepositoryInventory()}
          onSelectPrimary={(linkId) => void handleSelectPrimary(linkId)}
          onRefresh={(linkId) => void handleRefreshRepository(linkId)}
          onEnableForProject={(row) => void handleEnableRepository(row)}
          onDisableForProject={(linkId) => void handleUnlinkRepository(linkId)}
          onDisconnectSource={(sourceId) => void handleDisconnectAccessSource(sourceId)}
        />
      </GithubDetailsModal>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">GitHub repositories</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={() => setIsManagementModalOpen(true)}
          >
            Manage repositories
          </button>
          <button
            type="button"
            className={buttonStyles({ variant: 'primary', size: 'sm' })}
            onClick={() => setIsModalOpen(true)}
            disabled={remainingSlots < 1}
            title={remainingSlots < 1 ? 'Maximum linked repositories reached.' : undefined}
          >
            <span className="inline-flex items-center gap-2">
              <Github className="h-4 w-4" />
              Link repositories
            </span>
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Linked {linkedRepositories.length} / {maxLinkedRepositories} repositories.
      </p>

      {isLoadingRepositoriesData ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading GitHub repositories...</p>
      ) : repositoriesDataError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <p>{repositoriesDataError.message}</p>
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm', className: 'mt-3' })}
            onClick={() => void reloadRepositoriesData()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {linkedRepositories.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm text-muted-foreground">No GitHub repositories linked yet.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {linkedRepositories.map((repository) => (
            <article key={repository.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {repository.customName?.trim() || repository.name || repository.fullName || 'Repository'}
                    {repository.primary ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] uppercase text-amber-800">
                        Primary
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{repository.fullName}</p>
                  {repository.url ? (
                    <a
                      href={repository.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-sky-700 hover:underline"
                    >
                      {repository.url}
                    </a>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Owner: {repository.ownerLogin || 'unknown'} · Sync: {toSyncLabel(repository.syncStatus)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!repository.primary ? (
                    <button
                      type="button"
                      className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                      onClick={() => void handleSelectPrimary(repository.id)}
                      disabled={isMutatingLinks}
                    >
                      Select
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                    onClick={() => void handleRefreshRepository(repository.id)}
                    disabled={isMutatingLinks}
                  >
                    <span className="inline-flex items-center gap-1">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </span>
                  </button>
                  <button
                    type="button"
                    className={buttonStyles({
                      variant: 'secondary',
                      size: 'sm',
                      className: 'text-rose-600 hover:text-rose-700',
                    })}
                    onClick={() => void handleUnlinkRepository(repository.id)}
                    disabled={isMutatingLinks}
                  >
                    Unlink
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
