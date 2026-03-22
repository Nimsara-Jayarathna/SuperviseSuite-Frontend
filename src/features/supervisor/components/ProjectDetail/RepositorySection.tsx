import { useEffect, useMemo, useState } from 'react';
import { env } from '@/app/config/env';
import { buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../../api/supervisorApi';
import type { SupervisorProjectDetail } from '../../types';

type RepositorySectionProps = {
  project: SupervisorProjectDetail;
  onUpdate: (updatedProject: SupervisorProjectDetail) => void;
};

type LinkMode = 'manual' | 'app';

const GITHUB_REPOSITORY_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

function toRepositoryPayload(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidGithubRepositoryUrl(value: string): boolean {
  return GITHUB_REPOSITORY_URL_PATTERN.test(value);
}

export function RepositorySection({ project, onUpdate }: RepositorySectionProps) {
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
  const [linkMode, setLinkMode] = useState<LinkMode>('manual');
  const [urlInput, setUrlInput] = useState(displayRepositoryUrl ?? '');
  const [initialEditValue, setInitialEditValue] = useState(displayRepositoryUrl ?? '');

  const hasRepository = project.github.repositoryLinked || Boolean(displayRepositoryUrl);

  useEffect(() => {
    if (!isLinkModalOpen) {
      setUrlInput(displayRepositoryUrl ?? '');
      setInitialEditValue(displayRepositoryUrl ?? '');
      setValidationError(null);
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
    setLinkMode('manual');
    setIsLinkModalOpen(true);
  }

  function closeLinkModal() {
    if (isSaving) {
      return;
    }
    setIsLinkModalOpen(false);
    setValidationError(null);
  }

  function closeRequestModal() {
    setRequestModal((current) => ({ ...current, isOpen: false }));
  }

  function closeConnectModal() {
    setConnectModal((current) => ({ ...current, isOpen: false }));
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
        repositoryUrl: displayRepositoryUrl ?? null,
      });
      url.searchParams.set('state', window.btoa(statePayload));
      window.location.assign(url.toString());
    } catch {
      setConnectModal({
        isOpen: true,
        status: 'error',
        title: 'Invalid GitHub App URL',
        message: 'VITE_GITHUB_APP_INSTALL_URL is invalid. Please update frontend environment configuration.',
      });
    }
  }

  async function handleRemoveRepository() {
    setValidationError(null);
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

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        onClose={requestModal.status === 'loading' ? undefined : closeRequestModal}
        onRetry={requestModal.status === 'error' ? () => void handleSaveRepository() : undefined}
      />
      <RequestStateModal
        isOpen={connectModal.isOpen}
        status={connectModal.status}
        title={connectModal.title}
        message={connectModal.message}
        onClose={connectModal.status === 'loading' ? undefined : closeConnectModal}
      />

      {isLinkModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4 py-6"
          onClick={closeLinkModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Link repository"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Link repository</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose one method to connect this project repository.
                </p>
              </div>
              <button
                type="button"
                className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                onClick={closeLinkModal}
                disabled={isSaving}
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 rounded-2xl bg-slate-50 p-2">
              <button
                type="button"
                className={buttonStyles({
                  variant: linkMode === 'manual' ? 'primary' : 'secondary',
                  size: 'sm',
                  className: 'w-full justify-center',
                })}
                onClick={() => {
                  setLinkMode('manual');
                  setValidationError(null);
                }}
                disabled={isSaving}
              >
                Manual URL
              </button>
              <button
                type="button"
                className={buttonStyles({
                  variant: linkMode === 'app' ? 'primary' : 'secondary',
                  size: 'sm',
                  className: 'w-full justify-center',
                })}
                onClick={() => {
                  setLinkMode('app');
                  setValidationError(null);
                }}
                disabled={isSaving}
              >
                GitHub App
              </button>
            </div>

            {linkMode === 'manual' ? (
              <div className="mt-5 space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Repository URL
                  </span>
                  <input
                    value={urlInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      const nextPayload = toRepositoryPayload(nextValue);
                      setUrlInput(nextValue);
                      if (nextPayload && !isValidGithubRepositoryUrl(nextPayload)) {
                        setValidationError('Please enter a valid GitHub repository URL');
                      } else {
                        setValidationError(null);
                      }
                    }}
                    placeholder="https://github.com/owner/repo"
                    className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                    disabled={isSaving}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  Use <code>https://github.com/owner/repo</code>. Clear the input to remove the linked repository.
                </p>

                {validationError ? <p className="text-sm text-rose-600">{validationError}</p> : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                    onClick={closeLinkModal}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={buttonStyles({ variant: 'primary', size: 'sm' })}
                    onClick={() => void handleSaveRepository()}
                    disabled={isSaving || !hasInputChanged || !isInputValid}
                  >
                    {isSaving ? 'Saving...' : 'Save repository'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4 rounded-2xl border border-border bg-slate-50/70 p-4">
                <p className="text-sm text-muted-foreground">
                  Connect GitHub App for secure repository sync and activity tracking. After installation,
                  this project will use app-based access.
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                    onClick={closeLinkModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={buttonStyles({ variant: 'primary', size: 'sm' })}
                    onClick={handleConnectGitHubApp}
                  >
                    Connect GitHub App
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">GitHub repository</h2>
        <button
          type="button"
          className={buttonStyles({ variant: 'primary', size: 'sm' })}
          onClick={openLinkModal}
          disabled={hasRepository || isSaving}
          title={hasRepository ? 'Remove the current repository before adding a new one.' : undefined}
        >
          Link repository
        </button>
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
        </div>
      )}
    </section>
  );
}
