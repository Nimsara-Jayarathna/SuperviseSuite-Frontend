import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { env } from '@/app/config/env';
import { buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { GithubDetailsModal } from '@/features/projects/components/GithubDetailsModal';
import { isApiException } from '@/services/apiClient';
import { Github } from 'lucide-react';
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
type LinkMethod = 'url' | 'github_app';

function toRepositoryPayload(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidGithubRepositoryUrl(value: string): boolean {
  return GITHUB_REPOSITORY_URL_PATTERN.test(value);
}

function toAccessScopeLabel(
  accessScope: string | null | undefined,
  count: number | null | undefined,
): string | null {
  if (accessScope === 'SINGLE_REPOSITORY') {
    return 'GitHub access: 1 repository available';
  }
  if (accessScope === 'MULTIPLE_REPOSITORIES') {
    return `GitHub access: ${typeof count === 'number' ? count : 'multiple'} repositories available`;
  }
  if (accessScope === 'NO_REPOSITORIES') {
    return 'GitHub access: no repositories selected yet';
  }
  if (accessScope === 'ACCESS_UNAVAILABLE') {
    return 'GitHub access is connected. Repository list will be resolved when needed.';
  }
  return null;
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
  const [selectedLinkMethod, setSelectedLinkMethod] = useState<LinkMethod | null>(null);
  const [urlInput, setUrlInput] = useState(displayRepositoryUrl ?? '');
  const [initialEditValue, setInitialEditValue] = useState(displayRepositoryUrl ?? '');
  const [linkModalStep, setLinkModalStep] = useState<LinkModalStep>('entry');
  const [connectedInstallationId, setConnectedInstallationId] = useState<number | null>(null);
  const [activeInstallationId, setActiveInstallationId] = useState<number | null>(null);
  const [installationRepositories, setInstallationRepositories] = useState<
    GitHubInstallationRepository[]
  >([]);
  const [isLoadingInstallationRepositories, setIsLoadingInstallationRepositories] = useState(false);
  const [isLoadingMoreInstallationRepositories, setIsLoadingMoreInstallationRepositories] =
    useState(false);
  const [installationRepositoriesNextPage, setInstallationRepositoriesNextPage] = useState<
    number | null
  >(null);
  const [installationRepositoriesHasNext, setInstallationRepositoriesHasNext] = useState(false);
  const [installationRepositoriesTotalCount, setInstallationRepositoriesTotalCount] = useState<
    number | null
  >(null);
  const [selectedInstallationRepositoryId, setSelectedInstallationRepositoryId] = useState<
    number | null
  >(null);
  const [repositorySelectionError, setRepositorySelectionError] = useState<string | null>(null);
  const [repositoryLoadMoreError, setRepositoryLoadMoreError] = useState<string | null>(null);
  const [isPreparingAccessRequest, setIsPreparingAccessRequest] = useState(false);
  const [generatedAccessRequestUrl, setGeneratedAccessRequestUrl] = useState<string | null>(null);
  const [generatedAccessRequestExpiresAt, setGeneratedAccessRequestExpiresAt] = useState<
    string | null
  >(null);
  const [accessRequestLinkNotice, setAccessRequestLinkNotice] = useState<string | null>(null);
  const [isAccessRequestLinkCopied, setIsAccessRequestLinkCopied] = useState(false);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);

  const hasRepository = project.github.repositoryLinked || Boolean(displayRepositoryUrl);
  const authorizedInstallationId = project.github.authorizedInstallationId ?? null;
  const effectiveInstallationId = connectedInstallationId ?? authorizedInstallationId;
  const accessScopeLabel = toAccessScopeLabel(
    project.github.accessScope,
    project.github.accessibleRepositoryCount,
  );
  const canConfigureRepositorySelection =
    !hasRepository &&
    typeof effectiveInstallationId === 'number' &&
    Number.isFinite(effectiveInstallationId) &&
    effectiveInstallationId > 0;

  useEffect(() => {
    if (!isLinkModalOpen) {
      setUrlInput(displayRepositoryUrl ?? '');
      setInitialEditValue(displayRepositoryUrl ?? '');
      setValidationError(null);
      setLinkModalStep('entry');
      setSelectedLinkMethod(null);
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

  useEffect(() => {
    const nextAuthorizedInstallationId =
      typeof project.github.authorizedInstallationId === 'number' &&
      project.github.authorizedInstallationId > 0
        ? project.github.authorizedInstallationId
        : null;

    setConnectedInstallationId(nextAuthorizedInstallationId);
  }, [project.github.authorizedInstallationId]);

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
    setSelectedLinkMethod(null);
    setIsLinkModalOpen(true);
    if (
      !hasRepository &&
      typeof effectiveInstallationId === 'number' &&
      Number.isFinite(effectiveInstallationId) &&
      effectiveInstallationId > 0
    ) {
      void openInstallationSelection(effectiveInstallationId);
    }
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
    if (copyFeedbackTimeoutRef.current) {
      window.clearTimeout(copyFeedbackTimeoutRef.current);
      copyFeedbackTimeoutRef.current = null;
    }
    setIsAccessRequestLinkCopied(false);
    setAccessRequestLinkNotice(null);
    setGeneratedAccessRequestUrl(null);
    setGeneratedAccessRequestExpiresAt(null);
    setRequestModal((current) => ({ ...current, isOpen: false }));
  }

  function closeConnectModal() {
    setConnectModal((current) => ({ ...current, isOpen: false }));
  }

  const openInstallationSelection = useCallback(
    async (installationId: number) => {
      if (!Number.isFinite(installationId) || installationId < 1) {
        setRepositorySelectionError('Invalid installation id received from GitHub setup.');
        setLinkModalStep('installation-selection');
        setSelectedLinkMethod(null);
        return;
      }

      setLinkModalStep('installation-selection');
      setSelectedLinkMethod(null);
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
    },
    [project.id],
  );

  async function handleLoadMoreInstallationRepositories() {
    if (
      !activeInstallationId ||
      !installationRepositoriesNextPage ||
      isLoadingMoreInstallationRepositories
    ) {
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

  async function handleRemoveAccessAuthorization() {
    setIsSaving(true);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Removing GitHub access authorization',
      message: 'Clearing project-level GitHub authorization and repository linkage data.',
    });

    try {
      const updatedProject = await supervisorApi.removeProjectGitHubAccessAuthorization(project.id);
      onUpdate(updatedProject);
      setConnectedInstallationId(null);
      setActiveInstallationId(null);
      setLinkModalStep('entry');
      setIsLinkModalOpen(false);
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: 'GitHub access authorization removed',
        message:
          'Project-level GitHub authorization was removed. You can now link a repository again using the regular flow.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to remove GitHub access authorization right now. Please try again.';
      setRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Failed to remove GitHub access authorization',
        message,
      });
    } finally {
      setIsSaving(false);
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
      setAccessRequestLinkNotice(null);
      setIsAccessRequestLinkCopied(true);
      if (copyFeedbackTimeoutRef.current) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
      copyFeedbackTimeoutRef.current = window.setTimeout(() => {
        setIsAccessRequestLinkCopied(false);
        copyFeedbackTimeoutRef.current = null;
      }, 1200);
    } catch {
      setIsAccessRequestLinkCopied(false);
      setAccessRequestLinkNotice('Unable to copy automatically. Copy the link manually.');
    }
  }

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

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

    if (!hasRepository) {
      setIsLinkModalOpen(true);
      void openInstallationSelection(pendingInstallationId);
    }
    onPendingInstallationHandled?.();
  }, [hasRepository, onPendingInstallationHandled, openInstallationSelection, pendingInstallationId]);

  const showAccessRequestLinkInModal =
    requestModal.isOpen && requestModal.status === 'success' && Boolean(generatedAccessRequestUrl);

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
              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'md' })}
                onClick={() => void handleCopyAccessRequestLink()}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{isAccessRequestLinkCopied ? 'Copied' : 'Copy link'}</span>
                  <span
                    aria-hidden="true"
                    className={`inline-flex text-emerald-600 transition-all duration-200 ${
                      isAccessRequestLinkCopied ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                    }`}
                  >
                    ✓
                  </span>
                </span>
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
          selectedMethod={selectedLinkMethod}
          urlInput={urlInput}
          validationError={validationError}
          isSaving={isSaving}
          hasInputChanged={hasInputChanged}
          isInputValid={isInputValid}
          onUrlChange={handleUrlInputChange}
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
          onBackToEntry={() => {
            setLinkModalStep('entry');
            setSelectedLinkMethod(null);
          }}
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
          onSelectMethod={setSelectedLinkMethod}
          onChangeMethod={() => setSelectedLinkMethod(null)}
        />
      </GithubDetailsModal>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">GitHub repository</h2>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={buttonStyles({ variant: 'primary', size: 'sm' })}
            onClick={openLinkModal}
            disabled={isSaving || hasRepository || canConfigureRepositorySelection}
            title={
              hasRepository
                ? 'Remove the current repository before selecting another one.'
                : canConfigureRepositorySelection
                  ? 'Use Configure repository in the access-authorization block below.'
                  : undefined
            }
          >
            <span className="inline-flex items-center gap-2">
              <Github className="h-4 w-4" />
              <span>Link repository</span>
            </span>
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
          {accessScopeLabel ? (
            <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
              {accessScopeLabel}
            </p>
          ) : null}
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
          {canConfigureRepositorySelection ? (
            <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                Existing GitHub Access Authorization
              </p>
              <p className="mt-2 text-sm text-amber-900">
                This project already has GitHub App access authorization. The actions below manage
                that existing authorization and repository linkage for this project.
              </p>
              {accessScopeLabel ? (
                <p className="mt-3 inline-flex rounded-full border border-amber-300 bg-white/70 px-2.5 py-1 text-xs text-amber-900">
                  {accessScopeLabel}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonStyles({ variant: 'primary', size: 'sm' })}
                  onClick={openLinkModal}
                  disabled={isSaving}
                >
                  Configure repository
                </button>
                <button
                  type="button"
                  className={buttonStyles({
                    variant: 'secondary',
                    size: 'sm',
                    className: 'text-rose-700 hover:text-rose-800',
                  })}
                  onClick={() => void handleRemoveAccessAuthorization()}
                  disabled={isSaving}
                >
                  Remove access linkage
                </button>
              </div>
            </div>
          ) : accessScopeLabel ? (
            <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
              {accessScopeLabel}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
