import { useCallback, useEffect, useMemo, useState } from 'react';
import { buttonStyles } from '@/components/ui/Button';
import { LastSyncedBadge } from '@/components/ui/LastSyncedBadge';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { GithubDetailsModal } from '@/features/projects/components/GithubDetailsModal';
import { normalizeSyncStatus, toSyncLabel } from '@/lib/syncStatus';
import { isApiException } from '@/services/apiClient';
import { Github } from 'lucide-react';
import { supervisorApi } from '../../api/supervisorApi';
import { useAvailableRepositories } from '../../hooks/useAvailableRepositories';
import { useGitHubSetupFlow } from '../../hooks/useGitHubSetupFlow';
import { useProjectRepositories } from '../../hooks/useProjectRepositories';
import { useRepositorySelection } from '../../hooks/useRepositorySelection';
import { normalizeGitHubRepositoryUrl } from '../../utils/githubRepositoryUrl';
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
import { RepositoryRenameModal } from './RepositoryRenameModal';

type RepositorySectionProps = {
  project: SupervisorProjectDetail;
  onUpdate: (updatedProject: SupervisorProjectDetail) => void;
  pendingSourceId?: string | null;
  pendingFlowType?: 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED' | null;
  onPendingSourceHandled?: () => void;
};

type ModalStep = 'method' | 'repository-selection';
type RepositorySelectionEntryMode = 'manual' | 'callback-direct' | 'callback-requested';

type RequestModalState = {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  title: string;
  message: string;
};

function toSourceLabel(source: ProjectGitHubRepositories['accessSources'][number]): string {
  return `${source.ownerLogin} (${source.accessType})`;
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
  const [selectionEntryMode, setSelectionEntryMode] =
    useState<RepositorySelectionEntryMode>('manual');

  const [publicRepositoryUrl, setPublicRepositoryUrl] = useState('');
  const [publicCustomName, setPublicCustomName] = useState('');

  const [isSubmittingPublicRepository, setIsSubmittingPublicRepository] = useState(false);
  const [isCreatingAccessRequest, setIsCreatingAccessRequest] = useState(false);
  const [isConfirmingRepositorySelection, setIsConfirmingRepositorySelection] = useState(false);
  const [isDismissingPendingAccess, setIsDismissingPendingAccess] = useState(false);
  const [isResolvingPendingAccess, setIsResolvingPendingAccess] = useState(false);
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
  const [editingDisplayNameRowKey, setEditingDisplayNameRowKey] = useState<string | null>(null);
  const [editingDisplayNameDraft, setEditingDisplayNameDraft] = useState('');
  const [displayNameEditError, setDisplayNameEditError] = useState<string | null>(null);
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);

  const [requestModal, setRequestModal] = useState<RequestModalState>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });

  const { isStartingOwnerInstall, startOwnerInstall } = useGitHubSetupFlow(project.id);

  const {
    data: availableRepositoriesData,
    isLoading: isLoadingAvailableRepositories,
    error: availableRepositoriesError,
    reload: reloadAvailableRepositories,
  } = useAvailableRepositories(modalStep === 'repository-selection' ? selectedSourceId : null);

  const linkedRepositories = useMemo(
    () => repositoriesData?.repositories ?? [],
    [repositoriesData?.repositories],
  );
  const accessSources = useMemo(
    () => repositoriesData?.accessSources ?? [],
    [repositoriesData?.accessSources],
  );
  const maxLinkedRepositories = repositoriesData?.maxLinkedRepositories ?? 5;
  const maxEnabledRepositories = repositoriesData?.maxEnabledRepositories ?? maxLinkedRepositories;
  const linkedCount = linkedRepositories.length;
  const enabledCount = linkedRepositories.filter((repository) => repository.enabled).length;
  const remainingLinkSlots = Math.max(0, maxLinkedRepositories - linkedCount);
  const remainingEnabledSlots = Math.max(0, maxEnabledRepositories - enabledCount);
  const linkedLimitReached = remainingLinkSlots < 1;
  const enabledLimitReached = remainingEnabledSlots < 1;
  const bothLimitsReached = linkedLimitReached && enabledLimitReached;
  const repositorySelectionCapacity = remainingLinkSlots;

  const managementRows = useMemo<RepositoryManagementRow[]>(() => {
    const rowsByRepoId = new Map<number, RepositoryManagementRow>();

    // 1. Process all linked repositories first to ensure they are the "authoritative" rows
    for (const linked of linkedRepositories) {
      const source = linked.sourceId ? accessSources.find((s) => s.id === linked.sourceId) : null;
      const rowKey = linked.sourceId
        ? `${linked.sourceId}:${linked.githubRepoId}`
        : `linked:${linked.id}`;

      rowsByRepoId.set(linked.githubRepoId, {
        rowKey,
        sourceId: linked.sourceId ?? null,
        accessType:
          source?.accessType ?? linked.accessType ?? (linked.sourceId ? 'UNKNOWN' : 'MANUAL'),
        githubRepositoryId: linked.githubRepositoryId,
        githubRepoId: linked.githubRepoId,
        linkId: linked.id,
        enabled: linked.enabled,
        primary: Boolean(linked.primary),
        customName: linked.customName,
        fullName: linked.fullName,
        ownerLogin: linked.ownerLogin,
        url: linked.url,
        syncStatus: linked.syncStatus,
      });
    }

    // 2. Add unlinked repositories from inventories if they aren't already represented by a link
    for (const source of accessSources) {
      const items = inventoryBySourceId[source.id] ?? [];
      for (const item of items) {
        if (rowsByRepoId.has(item.githubRepoId)) {
          continue;
        }

        const rowKey = `${source.id}:${item.githubRepoId}`;
        rowsByRepoId.set(item.githubRepoId, {
          rowKey,
          sourceId: source.id,
          accessType: source.accessType,
          githubRepositoryId: item.id,
          githubRepoId: item.githubRepoId,
          linkId: null,
          enabled: false,
          primary: false,
          customName: null,
          fullName: item.fullName,
          ownerLogin: item.ownerLogin,
          url: item.url,
          syncStatus: null,
        });
      }
    }

    return Array.from(rowsByRepoId.values()).sort((a, b) => {
      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }
      return (a.fullName ?? '').localeCompare(b.fullName ?? '');
    });
  }, [accessSources, inventoryBySourceId, linkedRepositories]);

  const selection = useRepositorySelection(
    repositorySelectionCapacity > 0 ? repositorySelectionCapacity : 0,
  );
  const clearSelection = selection.clear;

  const sourceById = useMemo(() => {
    return new Map(accessSources.map((source) => [source.id, source]));
  }, [accessSources]);

  const selectedSource = selectedSourceId ? (sourceById.get(selectedSourceId) ?? null) : null;

  useEffect(() => {
    if (!pendingSourceId) {
      return;
    }

    setIsModalOpen(true);
    setModalStep('repository-selection');
    setSelectedMethod(
      pendingFlowType === 'INSTALLATION_REQUESTED'
        ? 'INSTALLATION_REQUESTED'
        : 'INSTALLATION_DIRECT',
    );
    setSelectedSourceId(pendingSourceId);
    setSelectionEntryMode(
      pendingFlowType === 'INSTALLATION_REQUESTED' ? 'callback-requested' : 'callback-direct',
    );
    onPendingSourceHandled?.();
  }, [onPendingSourceHandled, pendingFlowType, pendingSourceId]);

  useEffect(() => {
    if (!isModalOpen && !pendingSourceId) {
      setPublicRepositoryUrl('');
      setPublicCustomName('');
      setGeneratedAccessRequestUrl(null);
      setGeneratedAccessRequestExpiresAt(null);
      setIsAccessRequestLinkCopied(false);
      setSelectedMethod(null);
      setSelectedSourceId(null);
      setSelectionEntryMode('manual');
      setModalStep('method');
      clearSelection();
    }
  }, [clearSelection, isModalOpen, pendingSourceId]);

  const loadRepositoryInventory = useCallback(async () => {
    setIsLoadingInventory(true);
    setInventoryError(null);
    try {
      const listing = await supervisorApi.getProjectRepositoriesInventory(project.id);
      const mapping: Record<string, GitHubRepositoryOption[]> = {};
      listing.inventory.forEach((res) => {
        mapping[res.sourceId] = res.items;
      });
      setInventoryBySourceId(mapping);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to load repository inventory for this project.';
      setInventoryError(message);
    } finally {
      setIsLoadingInventory(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (!isManagementModalOpen) {
      setEditingDisplayNameRowKey(null);
      setEditingDisplayNameDraft('');
      setDisplayNameEditError(null);
      return;
    }
    void loadRepositoryInventory();
  }, [accessSources, isManagementModalOpen, loadRepositoryInventory]);

  async function reloadProjectAndRepositories(projectId: string) {
    await reloadRepositoriesData();
    const updatedProject = await supervisorApi.getProjectById(projectId, true);
    onUpdate(updatedProject);
  }

  async function acknowledgePendingAccessIfPresent() {
    if (!project.github.hasUnacknowledgedAccess) {
      return;
    }
    try {
      await supervisorApi.acknowledgeProjectGitHubAccessUpdated(project.id);
    } catch {
      // Linking should still succeed even if acknowledge fails.
    }
  }

  function openRequestModal(status: RequestModalState['status'], title: string, message: string) {
    setRequestModal({ isOpen: true, status, title, message });
  }

  function closeRequestModal() {
    setRequestModal((current) => ({ ...current, isOpen: false }));
  }

  function startDisplayNameEdit(row: RepositoryManagementRow) {
    if (!row.linkId) {
      return;
    }
    setEditingDisplayNameRowKey(row.rowKey);
    setEditingDisplayNameDraft(row.customName ?? '');
    setDisplayNameEditError(null);
  }

  function cancelDisplayNameEdit() {
    setEditingDisplayNameRowKey(null);
    setEditingDisplayNameDraft('');
    setDisplayNameEditError(null);
  }

  async function saveDisplayNameEdit(row: RepositoryManagementRow) {
    if (!row.linkId || editingDisplayNameRowKey !== row.rowKey) {
      return;
    }

    const normalized = editingDisplayNameDraft.trim();
    if (normalized.length > 255) {
      setDisplayNameEditError('Display name must be 255 characters or less.');
      return;
    }

    setIsSavingDisplayName(true);
    setDisplayNameEditError(null);
    openRequestModal(
      'loading',
      'Updating display name',
      'Saving new display name for the repository.',
    );

    try {
      await supervisorApi.updateGitHubRepositoryDisplayName(
        row.linkId,
        normalized.length > 0 ? normalized : null,
      );
      await reloadProjectAndRepositories(project.id);
      cancelDisplayNameEdit();
      openRequestModal(
        'success',
        'Display name updated',
        'The repository display name was updated successfully.',
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to update display name right now.';
      setDisplayNameEditError(message);
      openRequestModal('error', 'Update failed', message);
    } finally {
      setIsSavingDisplayName(false);
    }
  }

  function openLinkedLimitError(context: 'link' | 'enable') {
    if (bothLimitsReached) {
      openRequestModal(
        'error',
        'Linked and enabled limits reached',
        context === 'link'
          ? 'Unlink one repository to add another. To activate a newly linked repository, disable one enabled repository.'
          : 'Unlink one repository and disable one enabled repository before enabling another.',
      );
      return;
    }
    openRequestModal(
      'error',
      'Linked repository limit reached',
      context === 'link'
        ? 'Unlink one repository before adding another one.'
        : 'Unlink one repository before enabling a new repository.',
    );
  }

  function openEnabledLimitError() {
    openRequestModal(
      'error',
      'Enabled repository limit reached',
      'Disable one enabled repository first, then enable another.',
    );
  }

  async function handleSubmitPublicRepository() {
    const repositoryUrl = normalizeGitHubRepositoryUrl(publicRepositoryUrl);
    if (!repositoryUrl) {
      openRequestModal(
        'error',
        'Invalid repository URL',
        'Enter a valid GitHub repository URL (for example: https://github.com/owner/repo).',
      );
      return;
    }

    if (linkedLimitReached) {
      openLinkedLimitError('link');
      return;
    }
    setIsSubmittingPublicRepository(true);
    openRequestModal(
      'loading',
      'Linking public repository',
      'Creating access source and linking repository.',
    );

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
            primary: enabledCount === 0,
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
      openRequestModal(
        'error',
        'Missing access source',
        'Select a valid access source and try again.',
      );
      return;
    }

    if (selection.selectionsPayload.length === 0) {
      openRequestModal('error', 'No repositories selected', 'Select at least one repository.');
      return;
    }

    setIsConfirmingRepositorySelection(true);
    openRequestModal(
      'loading',
      'Linking repositories',
      'Saving selected repositories for this project.',
    );

    try {
      await supervisorApi.linkGitHubRepositories({
        projectId: project.id,
        sourceId: selectedSourceId,
        repositories: selection.selectionsPayload,
      });
      await acknowledgePendingAccessIfPresent();
      await reloadProjectAndRepositories(project.id);
      setIsModalOpen(false);
      openRequestModal(
        'success',
        'Repositories linked',
        'Selected repositories were linked successfully.',
      );
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
      openRequestModal(
        'success',
        'Primary repository updated',
        'GitHub tab now tracks the selected repository.',
      );
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
    openRequestModal(
      'loading',
      'Refreshing repository',
      'Syncing repository metadata, commits, and contributors.',
    );
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
    const target = linkedRepositories.find((repository) => repository.id === linkId);
    if (target && normalizeSyncStatus(target.syncStatus) === 'IN_PROGRESS') {
      openRequestModal(
        'error',
        'Repository is syncing',
        'Cannot unlink repository while sync is in progress.',
      );
      return;
    }

    setIsMutatingLinks(true);
    openRequestModal('loading', 'Unlinking repository', 'Removing repository from this project.');
    try {
      await supervisorApi.unlinkGitHubRepository(linkId);
      await reloadProjectAndRepositories(project.id);
      openRequestModal(
        'success',
        'Repository unlinked',
        'Repository was removed from this project.',
      );
    } catch (error) {
      if (isApiException(error) && error.apiError.status === 409) {
        await reloadRepositoriesData();
        openRequestModal(
          'error',
          'Repository is syncing',
          'Cannot unlink while repository sync is in progress. Try again after sync completes.',
        );
      } else {
        const message = isApiException(error)
          ? error.apiError.message
          : 'Unable to unlink repository right now.';
        openRequestModal('error', 'Repository unlink failed', message);
      }
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleDisconnectAccessSource(sourceId: string) {
    const sourceHasSyncInProgress = linkedRepositories.some(
      (repository) =>
        repository.sourceId === sourceId &&
        normalizeSyncStatus(repository.syncStatus) === 'IN_PROGRESS',
    );
    if (sourceHasSyncInProgress) {
      openRequestModal(
        'error',
        'Repository is syncing',
        'Cannot disconnect access source while a repository sync is in progress.',
      );
      return;
    }

    setIsMutatingLinks(true);
    openRequestModal(
      'loading',
      'Disconnecting access source',
      'Removing source access and linked repositories from this project.',
    );
    try {
      await supervisorApi.disconnectGitHubAccessSource(sourceId);
      await reloadProjectAndRepositories(project.id);
      openRequestModal(
        'success',
        'Access source disconnected',
        'GitHub access source and related project links were removed.',
      );
    } catch (error) {
      if (isApiException(error) && error.apiError.status === 409) {
        await reloadRepositoriesData();
        openRequestModal(
          'error',
          'Repository is syncing',
          'Cannot unlink while repository sync is in progress. Try again after sync completes.',
        );
      } else {
        const message = isApiException(error)
          ? error.apiError.message
          : 'Unable to disconnect access source right now.';
        openRequestModal('error', 'Access source disconnect failed', message);
      }
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleEnableRepository(row: RepositoryManagementRow) {
    if (row.linkId) {
      if (enabledLimitReached) {
        openEnabledLimitError();
        return;
      }

      setIsMutatingLinks(true);
      openRequestModal(
        'loading',
        'Enabling repository',
        'Re-enabling repository tracking for this project.',
      );
      try {
        await supervisorApi.enableGitHubRepository(row.linkId);
        await reloadProjectAndRepositories(project.id);
        openRequestModal(
          'success',
          'Repository enabled',
          'Repository is now active for this project.',
        );
      } catch (error) {
        const message = isApiException(error)
          ? error.apiError.message
          : 'Unable to enable repository right now.';
        openRequestModal('error', 'Repository enable failed', message);
      } finally {
        setIsMutatingLinks(false);
      }
      return;
    }

    if (!row.sourceId || !row.githubRepositoryId) {
      openRequestModal(
        'error',
        'Repository enable failed',
        'Repository source details are missing. Reload and try again.',
      );
      return;
    }
    if (linkedLimitReached) {
      openLinkedLimitError('enable');
      return;
    }
    if (enabledLimitReached) {
      openEnabledLimitError();
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
            primary: enabledCount === 0,
          },
        ],
      });
      await acknowledgePendingAccessIfPresent();
      await reloadProjectAndRepositories(project.id);
      openRequestModal(
        'success',
        'Repository enabled',
        'Repository is now linked to this project.',
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to enable repository right now.';
      openRequestModal('error', 'Repository enable failed', message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleDisableRepository(linkId: string) {
    setIsMutatingLinks(true);
    openRequestModal(
      'loading',
      'Disabling repository',
      'Keeping link access while pausing repository sync.',
    );
    try {
      await supervisorApi.disableGitHubRepository(linkId);
      await reloadProjectAndRepositories(project.id);
      openRequestModal(
        'success',
        'Repository disabled',
        'Repository is linked but inactive. You can re-enable it later.',
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to disable repository right now.';
      openRequestModal('error', 'Repository disable failed', message);
    } finally {
      setIsMutatingLinks(false);
    }
  }

  async function handleToggleRepositoryEnabled(row: RepositoryManagementRow) {
    if (row.enabled) {
      if (!row.linkId) {
        return;
      }
      await handleDisableRepository(row.linkId);
      return;
    }
    if (!row.linkId && linkedLimitReached) {
      openLinkedLimitError('enable');
      return;
    }
    if (enabledLimitReached) {
      openEnabledLimitError();
      return;
    }
    await handleEnableRepository(row);
  }

  async function handleDismissPendingAccessAlert() {
    setIsDismissingPendingAccess(true);
    try {
      await supervisorApi.acknowledgeProjectGitHubAccessUpdated(project.id);
      await reloadProjectAndRepositories(project.id);
      openRequestModal('success', 'Access update dismissed', 'Access update alert was dismissed.');
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to dismiss access update alert right now.';
      openRequestModal('error', 'Dismiss failed', message);
    } finally {
      setIsDismissingPendingAccess(false);
    }
  }

  async function handleOpenManageRepositories() {
    if (!project.github.hasUnacknowledgedAccess) {
      setIsManagementModalOpen(true);
      return;
    }

    setIsResolvingPendingAccess(true);
    openRequestModal(
      'loading',
      'Loading granted repositories',
      'Preparing repository selection for newly granted GitHub access.',
    );

    try {
      const summary = await supervisorApi.getProjectGitHubAccessUpdatedSummary(project.id);
      const resolvedSourceId = summary.sourceId?.trim() ?? '';
      const resolvedFlowType =
        summary.flowType === 'INSTALLATION_DIRECT' || summary.flowType === 'INSTALLATION_REQUESTED'
          ? summary.flowType
          : 'INSTALLATION_REQUESTED';

      if (!resolvedSourceId) {
        closeRequestModal();
        setIsManagementModalOpen(true);
        openRequestModal(
          'error',
          'Access source not available',
          'No active access source was found for this granted access. Open manage repositories and reconnect access if needed.',
        );
        return;
      }

      closeRequestModal();
      setSelectedMethod(
        resolvedFlowType === 'INSTALLATION_REQUESTED'
          ? 'INSTALLATION_REQUESTED'
          : 'INSTALLATION_DIRECT',
      );
      setSelectionEntryMode(
        resolvedFlowType === 'INSTALLATION_REQUESTED' ? 'callback-requested' : 'callback-direct',
      );
      setSelectedSourceId(resolvedSourceId);
      setModalStep('repository-selection');
      setIsModalOpen(true);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to load newly granted repositories right now.';
      openRequestModal('error', 'Failed to load granted repositories', message);
    } finally {
      setIsResolvingPendingAccess(false);
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

      <GithubDetailsModal
        isOpen={isModalOpen}
        title="Link repositories"
        onClose={() => {
          setIsModalOpen(false);
          onPendingSourceHandled?.();
        }}
      >
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
          maxSelectableCount={repositorySelectionCapacity}
          selectionLimitMessage={
            linkedLimitReached
              ? bothLimitsReached
                ? 'Linked and enabled limits reached. Unlink one repository to add another. To enable another repository, disable one enabled repository.'
                : 'Linked repository limit reached. Unlink one repository to add another one.'
              : null
          }
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
          linkedCount={linkedCount}
          maxLinkedRepositories={maxLinkedRepositories}
          enabledCount={enabledCount}
          maxEnabledRepositories={maxEnabledRepositories}
          remainingLinkSlots={remainingLinkSlots}
          remainingEnabledSlots={remainingEnabledSlots}
          isMutating={isMutatingLinks}
          isLoadingInventory={isLoadingInventory}
          inventoryError={inventoryError}
          onReloadInventory={() => void loadRepositoryInventory()}
          onSelectPrimary={(linkId) => void handleSelectPrimary(linkId)}
          onRefresh={(linkId) => void handleRefreshRepository(linkId)}
          onToggleEnabled={(row) => void handleToggleRepositoryEnabled(row)}
          onUnlinkRepository={(linkId) => void handleUnlinkRepository(linkId)}
          onDisconnectSource={(sourceId) => void handleDisconnectAccessSource(sourceId)}
          isSavingDisplayName={isSavingDisplayName}
          onStartDisplayNameEdit={startDisplayNameEdit}
        />
      </GithubDetailsModal>

      <RepositoryRenameModal
        isOpen={!!editingDisplayNameRowKey}
        draftName={editingDisplayNameDraft}
        error={displayNameEditError}
        isSaving={isSavingDisplayName}
        onChange={setEditingDisplayNameDraft}
        onSave={() => {
          const row = managementRows.find((r) => r.rowKey === editingDisplayNameRowKey);
          if (row) {
            void saveDisplayNameEdit(row);
          }
        }}
        onClose={cancelDisplayNameEdit}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">GitHub repositories</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              onClick={() => void handleOpenManageRepositories()}
              disabled={isResolvingPendingAccess}
            >
              {isResolvingPendingAccess ? 'Loading...' : 'Manage repositories'}
            </button>
            {project.github.hasUnacknowledgedAccess && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </span>
            )}
          </div>
          {project.github.hasUnacknowledgedAccess ? (
            <button
              type="button"
              className={buttonStyles({ variant: 'ghost', size: 'sm' })}
              onClick={() => void handleDismissPendingAccessAlert()}
              disabled={isDismissingPendingAccess}
            >
              {isDismissingPendingAccess ? 'Dismissing...' : 'Dismiss access alert'}
            </button>
          ) : null}
          <button
            type="button"
            className={buttonStyles({ variant: 'primary', size: 'sm' })}
            onClick={() => setIsModalOpen(true)}
            disabled={repositorySelectionCapacity < 1}
            title={
              linkedLimitReached
                ? bothLimitsReached
                  ? 'Linked and enabled limits reached. Unlink one repository to continue linking.'
                  : 'Linked repository limit reached. Unlink one repository to continue.'
                : undefined
            }
          >
            <span className="inline-flex items-center gap-2">
              <Github className="h-4 w-4" />
              Link repositories
            </span>
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Linked {linkedCount} / {maxLinkedRepositories} repositories · Enabled {enabledCount} /{' '}
        {maxEnabledRepositories}.
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
          {linkedRepositories.map((repository) =>
            (() => {
              const normalizedSyncStatus = normalizeSyncStatus(repository.syncStatus);
              const isSynced = normalizedSyncStatus === 'SUCCESS';
              const isSyncing = normalizedSyncStatus === 'IN_PROGRESS';
              return (
                <article
                  key={repository.id}
                  className={`rounded-2xl border p-4 transition-all duration-300 ${repository.primary ? 'border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/40 shadow-sm' : 'border-slate-200 bg-white'} ${!repository.enabled ? 'bg-slate-50/50 opacity-60 grayscale-[0.2]' : ''}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`truncate text-sm font-semibold ${repository.enabled ? 'text-foreground' : 'text-slate-600'}`}
                        >
                          {repository.customName?.trim() ||
                            repository.name ||
                            repository.fullName ||
                            'Repository'}
                        </h3>
                        {repository.primary ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                            Primary
                          </span>
                        ) : null}
                        {!repository.enabled ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                            Disabled
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-12 sm:gap-4">
                        {/* Repository Path */}
                        <div className="flex min-w-0 items-center gap-1.5 hover:text-foreground sm:col-span-5">
                          <Github className="h-3.5 w-3.5 shrink-0" />
                          {repository.url ? (
                            <a
                              href={repository.url}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate hover:underline"
                            >
                              {repository.fullName}
                            </a>
                          ) : (
                            <span className="truncate">{repository.fullName}</span>
                          )}
                        </div>

                        {/* Owner */}
                        <div className="flex min-w-0 items-center sm:col-span-4">
                          <span className="truncate">
                            Owner:{' '}
                            <span className="font-medium text-slate-700">
                              {repository.ownerLogin || 'unknown'}
                            </span>
                          </span>
                        </div>

                        {/* Sync Status */}
                        <div className="flex min-w-0 items-center gap-1.5 sm:col-span-3 sm:justify-end">
                          <LastSyncedBadge
                            lastSyncedAt={isSynced ? repository.lastSyncedAt : null}
                            fallbackText={toSyncLabel(normalizedSyncStatus)}
                            className={
                              isSynced
                                ? 'bg-transparent p-0 text-[12px] text-emerald-700'
                                : isSyncing
                                  ? 'bg-transparent p-0 text-[12px] text-indigo-600'
                                  : 'bg-transparent p-0 text-[12px] text-slate-500'
                            }
                            iconClassName={
                              isSynced
                                ? 'h-3.5 w-3.5 text-emerald-500'
                                : isSyncing
                                  ? 'h-3.5 w-3.5 animate-spin text-indigo-500'
                                  : 'h-3.5 w-3.5 text-slate-400'
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })(),
          )}
        </div>
      )}
    </section>
  );
}
