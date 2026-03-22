import { useEffect, useMemo, useState } from 'react';
import { env } from '@/app/config/env';
import { buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { GithubDetailsModal } from '@/features/projects/components/GithubDetailsModal';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../../api/supervisorApi';
import type { GitHubInstallationRepository, SupervisorProjectDetail } from '../../types';
import { RepositoryLinkModalContent } from './RepositoryLinkModalContent';

type RepositorySectionProps = {
  project: SupervisorProjectDetail;
  onUpdate: (updatedProject: SupervisorProjectDetail) => void;
  pendingInstallationId?: number | null;
  onPendingInstallationHandled?: () => void;
};

const GITHUB_REPOSITORY_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

type LinkModalStep = 'entry' | 'installation-selection';

function toRepositoryPayload(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidGithubRepositoryUrl(value: string): boolean {
  return GITHUB_REPOSITORY_URL_PATTERN.test(value);
}

export function RepositorySection({
  project,
  onUpdate,
  pendingInstallationId,
  onPendingInstallationHandled,
}: RepositorySectionProps) {
  const linkedRepository = project.github.repositories[0];
  const displayRepositoryUrl = linkedRepository?.url ?? project.repositoryUrl ?? null;
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestModal, setRequestModal] = useState<{
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
  const [connectModal, setConnectModal] = useState<{
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
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(displayRepositoryUrl ?? '');
  const [initialEditValue, setInitialEditValue] = useState(displayRepositoryUrl ?? '');
  const [linkModalStep, setLinkModalStep] = useState<LinkModalStep>('entry');
  const [connectedInstallationId, setConnectedInstallationId] = useState<number | null>(null);
  const [activeInstallationId, setActiveInstallationId] = useState<number | null>(null);
  const [installationRepositories, setInstallationRepositories] = useState<GitHubInstallationRepository[]>([]);
  const [isLoadingInstallationRepositories, setIsLoadingInstallationRepositories] = useState(false);
  const [isLoadingMoreInstallationRepositories, setIsLoadingMoreInstallationRepositories] =
    useState(false);
  const [installationRepositoriesNextPage, setInstallationRepositoriesNextPage] = useState<number | null>(null);
  const [installationRepositoriesHasNext, setInstallationRepositoriesHasNext] = useState(false);
  const [installationRepositoriesTotalCount, setInstallationRepositoriesTotalCount] = useState<number | null>(
    null,
  );
  const [selectedInstallationRepositoryId, setSelectedInstallationRepositoryId] = useState<number | null>(null);
  const [repositorySelectionError, setRepositorySelectionError] = useState<string | null>(null);
  const [repositoryLoadMoreError, setRepositoryLoadMoreError] = useState<string | null>(null);
  const [isPreparingAccessRequest, setIsPreparingAccessRequest] = useState(false);
  const [generatedAccessRequestUrl, setGeneratedAccessRequestUrl] = useState<string | null>(null);
  const [generatedAccessRequestExpiresAt, setGeneratedAccessRequestExpiresAt] = useState<string | null>(
    null,
  );
  const [accessRequestLinkNotice, setAccessRequestLinkNotice] = useState<string | null>(null);

  const hasRepository = project.github.repositoryLinked || Boolean(displayRepositoryUrl);

  useEffect(() => {
    if (!isLinkModalOpen) {
      setUrlInput(displayRepositoryUrl ?? '');
      setInitialEditValue(displayRepositoryUrl ?? '');
      setValidationError(null);
      setLinkModalStep('entry');
      setRepositorySelectionError(null);
      setInstallationRepositories([]);
      setSelectedInstallationRepositoryId(null);
      setIsLoadingInstallationRepositories(false);
      setIsLoadingMoreInstallationRepositories(false);
      setActiveInstallationId(null);
      setInstallationRepositoriesNextPage(null);
      setInstallationRepositoriesHasNext(false);
      setInstallationRepositoriesTotalCount(null);
      setRepositoryLoadMoreError(null);
    }
  }, [displayRepositoryUrl, isLinkModalOpen]);

  const hasInputChanged = useMemo(
    () => urlInput !== initialEditValue,
    [initialEditValue, urlInput],
  );

  const nextRepositoryPayload = useMemo(() => toRepositoryPayload(urlInput), [urlInput]);
  const isInputValid = useMemo(
    () => nextRepositoryPayload === null || isValidGithubRepositoryUrl(nextRepositoryPayload),
    [nextRepositoryPayload],
  );

  function openLinkModal() {
    setUrlInput(displayRepositoryUrl ?? '');
    setInitialEditValue(displayRepositoryUrl ?? '');
    setValidationError(null);
    setLinkModalStep('entry');
    setIsLinkModalOpen(true);
  }

  function closeLinkModal() {
    if (isSaving || isLoadingInstallationRepositories) {
      return;
    }
    setIsLinkModalOpen(false);
    setValidationError(null);
    setRepositorySelectionError(null);
  }

  function closeRequestModal() {
    setAccessRequestLinkNotice(null);
    setGeneratedAccessRequestUrl(null);
    setGeneratedAccessRequestExpiresAt(null);
    setRequestModal((current) => ({ ...current, isOpen: false }));
  }

  function closeConnectModal() {
    setConnectModal((current) => ({ ...current, isOpen: false }));
  }

  async function openInstallationSelection(installationId: number) {
    if (!Number.isFinite(installationId) || installationId < 1) {
      setRepositorySelectionError('Invalid installation id received from GitHub setup.');
      setLinkModalStep('installation-selection');
      return;
    }

    setLinkModalStep('installation-selection');
    setActiveInstallationId(installationId);
    setIsLoadingInstallationRepositories(true);
    setIsLoadingMoreInstallationRepositories(false);
    setRepositorySelectionError(null);
    setRepositoryLoadMoreError(null);
    setInstallationRepositories([]);
    setSelectedInstallationRepositoryId(null);
    setInstallationRepositoriesNextPage(null);
    setInstallationRepositoriesHasNext(false);
    setInstallationRepositoriesTotalCount(null);

    try {
      const repositoriesPage = await supervisorApi.getInstallationRepositories(
        project.id,
        installationId,
        1,
      );
      setInstallationRepositories(repositoriesPage.items);
      setInstallationRepositoriesNextPage(repositoriesPage.nextPage);
      setInstallationRepositoriesHasNext(repositoriesPage.hasNext);
      setInstallationRepositoriesTotalCount(repositoriesPage.totalCount);
      const selectable = repositoriesPage.items[0] ?? null;
      setSelectedInstallationRepositoryId(selectable ? selectable.repositoryId : null);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to load repositories for this installation.';
      setRepositorySelectionError(message);
    } finally {
      setIsLoadingInstallationRepositories(false);
    }
  }

  async function handleLoadMoreInstallationRepositories() {
    if (!activeInstallationId || !installationRepositoriesNextPage || isLoadingMoreInstallationRepositories) {
      return;
    }

    setIsLoadingMoreInstallationRepositories(true);
    setRepositoryLoadMoreError(null);

    try {
      const repositoriesPage = await supervisorApi.getInstallationRepositories(
        project.id,
        activeInstallationId,
        installationRepositoriesNextPage,
      );
      setInstallationRepositories((previous) => {
        const seen = new Set(previous.map((item) => item.repositoryId));
        const nextItems = repositoriesPage.items.filter((item) => !seen.has(item.repositoryId));
        return [...previous, ...nextItems];
      });
      setInstallationRepositoriesNextPage(repositoriesPage.nextPage);
      setInstallationRepositoriesHasNext(repositoriesPage.hasNext);
      setInstallationRepositoriesTotalCount(repositoriesPage.totalCount);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to load more repositories right now.';
      setRepositoryLoadMoreError(message);
    } finally {
      setIsLoadingMoreInstallationRepositories(false);
    }
  }

  function handleConnectGitHubApp() {
    if (!env.githubAppInstallUrl) {
      setConnectModal({
        isOpen: true,
        status: 'error',
        title: 'GitHub App setup unavailable',
        message:
          'GitHub App install URL is not configured yet. Set VITE_GITHUB_APP_INSTALL_URL to enable connection.',
      });
      return;
    }

    try {
      const url = new URL(env.githubAppInstallUrl);
      const statePayload = JSON.stringify({
        projectId: project.id,
      });
      url.searchParams.set('state', window.btoa(statePayload));
      window.location.assign(url.toString());
    } catch {
      setConnectModal({
        isOpen: true,
        status: 'error',
        title: 'Invalid GitHub App URL',
        message:
          'VITE_GITHUB_APP_INSTALL_URL is invalid. Please update frontend environment configuration.',
      });
    }
  }

  async function handleRequestMoreRepositoryAccess() {
    setIsPreparingAccessRequest(true);
    setGeneratedAccessRequestUrl(null);
    setGeneratedAccessRequestExpiresAt(null);
    setAccessRequestLinkNotice(null);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Preparing access request',
      message: 'Creating a project-scoped access request before continuing to GitHub.',
    });

    try {
      const data = await supervisorApi.createGitHubRepositoryAccessRequest(project.id);
      const requestUrl = data.requestUrl?.trim();
      if (!requestUrl) {
        throw new Error('Missing request URL');
      }
      const absoluteUrl = new URL(requestUrl, window.location.origin).toString();
      setGeneratedAccessRequestUrl(absoluteUrl);
      setGeneratedAccessRequestExpiresAt(data.expiresAt ?? null);
      setAccessRequestLinkNotice(null);
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: 'Access request link created',
        message: 'Use the generated access link below to continue the GitHub authorization flow.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to create access request right now. Please try again.';
      setRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Access request failed',
        message,
      });
    } finally {
      setIsPreparingAccessRequest(false);
    }
  }

  async function handleCopyAccessRequestLink() {
    if (!generatedAccessRequestUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedAccessRequestUrl);
      setAccessRequestLinkNotice('Access request link copied.');
    } catch {
      setAccessRequestLinkNotice('Unable to copy automatically. Copy the link manually.');
    }
  }

  async function handleConfirmRepositorySelection() {
    if (!activeInstallationId || !selectedInstallationRepositoryId) {
      setRepositorySelectionError('Select one repository to continue.');
      return;
    }

    setGeneratedAccessRequestUrl(null);
    setGeneratedAccessRequestExpiresAt(null);
    setAccessRequestLinkNotice(null);
    setIsSaving(true);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Linking repository',
      message: 'Saving selected repository and syncing GitHub data for this project.',
    });

    try {
      await supervisorApi.linkProjectGitHubRepository(project.id, {
        installationId: activeInstallationId,
        repositoryId: selectedInstallationRepositoryId,
      });
      const updatedProject = await supervisorApi.getProjectById(project.id, true);
      onUpdate(updatedProject);

      setIsLinkModalOpen(false);
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: 'Repository linked',
        message: 'Selected GitHub repository was linked and synced successfully.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to link selected repository. Please try again.';
      setRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Repository link failed',
        message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveRepository() {
    setValidationError(null);
    setGeneratedAccessRequestUrl(null);
    setGeneratedAccessRequestExpiresAt(null);
    setAccessRequestLinkNotice(null);
    setIsSaving(true);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Removing GitHub link',
      message: 'Disconnecting GitHub repository and clearing project GitHub linkage.',
    });

    try {
      const updatedProject = await supervisorApi.updateRepository(project.id, null);
      onUpdate(updatedProject);
      setUrlInput('');
      setInitialEditValue('');
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: 'GitHub removed',
        message: 'GitHub repository/app linkage was removed from this project.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to remove GitHub linkage. Please try again.';
      setRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Unable to remove GitHub linkage',
        message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveRepository() {
    if (!isInputValid) {
      setValidationError('Please enter a valid GitHub repository URL');
      return;
    }

    const repositoryUrl = nextRepositoryPayload;
    setValidationError(null);
    setGeneratedAccessRequestUrl(null);
    setGeneratedAccessRequestExpiresAt(null);
    setAccessRequestLinkNotice(null);

    setIsSaving(true);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Updating repository link',
      message: 'Saving GitHub repository settings for this project.',
    });

    try {
      const updatedProject = await supervisorApi.updateRepository(project.id, repositoryUrl);
      onUpdate(updatedProject);
      setIsLinkModalOpen(false);
      const nextDisplayUrl =
        updatedProject.github.repositories[0]?.url ?? updatedProject.repositoryUrl ?? '';
      setUrlInput(nextDisplayUrl);
      setInitialEditValue(nextDisplayUrl);
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: repositoryUrl ? 'Repository linked' : 'Repository removed',
        message: repositoryUrl
          ? 'GitHub repository URL was saved successfully.'
          : 'GitHub repository URL was removed successfully.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to update repository. Please try again.';
      setRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Unable to update repository',
        message: message || 'Unable to update repository. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleUrlInputChange(nextValue: string) {
    const nextPayload = toRepositoryPayload(nextValue);
    setUrlInput(nextValue);
    if (nextPayload && !isValidGithubRepositoryUrl(nextPayload)) {
      setValidationError('Please enter a valid GitHub repository URL');
    } else {
      setValidationError(null);
    }
  }

  useEffect(() => {
    if (!pendingInstallationId) {
      return;
    }

    setConnectedInstallationId(pendingInstallationId);

    if (hasRepository) {
      setConnectModal({
        isOpen: true,
        status: 'error',
        title: 'Repository already linked',
        message:
          'A repository is already linked to this project. Remove it first if you want to link a different repository.',
      });
      onPendingInstallationHandled?.();
      return;
    }

    setIsLinkModalOpen(true);
    void openInstallationSelection(pendingInstallationId);
    onPendingInstallationHandled?.();
  }, [hasRepository, onPendingInstallationHandled, pendingInstallationId]);

  const showAccessRequestLinkInModal =
    requestModal.isOpen &&
    requestModal.status === 'success' &&
    Boolean(generatedAccessRequestUrl);

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        autoCloseOnSuccess={!showAccessRequestLinkInModal}
        content={
          showAccessRequestLinkInModal && generatedAccessRequestUrl ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-left">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Access Request Link
              </p>
              <a
                href={generatedAccessRequestUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-xs text-sky-700 underline-offset-2 hover:underline"
              >
                {generatedAccessRequestUrl}
              </a>
              {generatedAccessRequestExpiresAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Expires at {new Date(generatedAccessRequestExpiresAt).toLocaleString()}
                </p>
              ) : null}
              {accessRequestLinkNotice ? (
                <p className="mt-2 text-xs text-muted-foreground">{accessRequestLinkNotice}</p>
              ) : null}
            </div>
          ) : null
        }
        footer={
          showAccessRequestLinkInModal && generatedAccessRequestUrl ? (
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={generatedAccessRequestUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({ variant: 'secondary', size: 'md' })}
              >
                Open link
              </a>
              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'md' })}
                onClick={() => void handleCopyAccessRequestLink()}
              >
                Copy link
              </button>
              <button
                type="button"
                className={buttonStyles({ variant: 'primary', size: 'md' })}
                onClick={closeRequestModal}
              >
                Close
              </button>
            </div>
          ) : undefined
        }
        onClose={requestModal.status === 'loading' ? undefined : closeRequestModal}
      />
      <RequestStateModal
        isOpen={connectModal.isOpen}
        status={connectModal.status}
        title={connectModal.title}
        message={connectModal.message}
        onClose={connectModal.status === 'loading' ? undefined : closeConnectModal}
      />

      <GithubDetailsModal isOpen={isLinkModalOpen} title="Link repository" onClose={closeLinkModal}>
        <RepositoryLinkModalContent
          step={linkModalStep}
          urlInput={urlInput}
          validationError={validationError}
          isSaving={isSaving}
          hasInputChanged={hasInputChanged}
          isInputValid={isInputValid}
          onUrlChange={handleUrlInputChange}
          onClose={closeLinkModal}
          onSave={() => void handleSaveRepository()}
          onConnectGitHubApp={handleConnectGitHubApp}
          onRequestMoreRepositoryAccess={() => void handleRequestMoreRepositoryAccess()}
          isRequestingMoreRepositoryAccess={isPreparingAccessRequest}
          connectedInstallationId={connectedInstallationId}
          onUseConnectedInstallation={(installationId) => {
            void openInstallationSelection(installationId);
          }}
          repositories={installationRepositories}
          selectedRepositoryId={selectedInstallationRepositoryId}
          isLoadingRepositories={isLoadingInstallationRepositories}
          repositorySelectionError={repositorySelectionError}
          onSelectRepository={setSelectedInstallationRepositoryId}
          onConfirmRepositorySelection={() => void handleConfirmRepositorySelection()}
          onBackToEntry={() => setLinkModalStep('entry')}
          onRetryLoadRepositories={() => {
            if (activeInstallationId) {
              void openInstallationSelection(activeInstallationId);
            }
          }}
          hasMoreRepositories={installationRepositoriesHasNext}
          totalRepositoryCount={installationRepositoriesTotalCount}
          isLoadingMoreRepositories={isLoadingMoreInstallationRepositories}
          onLoadMoreRepositories={() => void handleLoadMoreInstallationRepositories()}
          loadMoreError={repositoryLoadMoreError}
        />
      </GithubDetailsModal>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">GitHub repository</h2>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={() => void handleRequestMoreRepositoryAccess()}
            disabled={isSaving || isPreparingAccessRequest}
          >
            {isPreparingAccessRequest ? 'Preparing request...' : 'Request More Repository Access'}
          </button>
          <button
            type="button"
            className={buttonStyles({ variant: 'primary', size: 'sm' })}
            onClick={openLinkModal}
            disabled={hasRepository || isSaving}
            title={
              hasRepository ? 'Remove the current repository before adding a new one.' : undefined
            }
          >
            Link repository
          </button>
        </div>
      </div>

      {hasRepository ? (
        <div className="mt-5 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={displayRepositoryUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
            >
              {displayRepositoryUrl}
            </a>
            <button
              type="button"
              className={buttonStyles({
                variant: 'secondary',
                size: 'sm',
                className: 'text-rose-600 hover:text-rose-700',
              })}
              onClick={() => void handleRemoveRepository()}
              disabled={isSaving}
            >
              Remove
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Linked via repository URL or GitHub App integration.
          </p>
          <p className="text-xs text-muted-foreground">
            Only one repository is supported right now. Remove this repository to add another one.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          <p className="text-sm text-muted-foreground">No GitHub repository linked yet.</p>
          <p className="text-xs text-muted-foreground">
            Use Link repository to choose Manual URL or GitHub App connection.
          </p>
          {connectedInstallationId ? (
            <p className="text-xs text-amber-700">
              GitHub App is connected for this project. Open Link repository to select a repository.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
