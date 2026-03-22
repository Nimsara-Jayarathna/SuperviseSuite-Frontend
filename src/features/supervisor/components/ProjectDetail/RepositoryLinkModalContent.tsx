import { buttonStyles } from '@/components/ui/Button';
import { Github } from 'lucide-react';
import type { GitHubInstallationRepository } from '../../types';

type RepositoryLinkMethod = 'url' | 'github_app';

type RepositoryLinkModalContentProps = {
  step: 'entry' | 'installation-selection';
  selectedMethod: RepositoryLinkMethod | null;
  urlInput: string;
  validationError: string | null;
  isSaving: boolean;
  hasInputChanged: boolean;
  isInputValid: boolean;
  onUrlChange: (nextValue: string) => void;
  onClose: () => void;
  onSave: () => void;
  onConnectGitHubApp: () => void;
  onRequestMoreRepositoryAccess: () => void;
  isRequestingMoreRepositoryAccess: boolean;
  connectedInstallationId: number | null;
  onUseConnectedInstallation: (installationId: number) => void;
  repositories: GitHubInstallationRepository[];
  selectedRepositoryId: number | null;
  isLoadingRepositories: boolean;
  repositorySelectionError: string | null;
  onSelectRepository: (repositoryId: number) => void;
  onConfirmRepositorySelection: () => void;
  onBackToEntry: () => void;
  onRetryLoadRepositories: () => void;
  hasMoreRepositories: boolean;
  totalRepositoryCount: number | null;
  isLoadingMoreRepositories: boolean;
  onLoadMoreRepositories: () => void;
  loadMoreError: string | null;
  onSelectMethod: (method: RepositoryLinkMethod) => void;
  onChangeMethod: () => void;
};

function RepositorySelectionSkeleton() {
  return (
    <div
      className="min-h-80 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-2"
      aria-live="polite"
      aria-busy="true"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`repository-skeleton-${index}`}
          className="rounded-2xl border border-slate-200 bg-white p-3 animate-pulse"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-7/12 rounded bg-slate-200" />
              <div className="h-3 w-10/12 rounded bg-slate-200" />
              <div className="h-3 w-4/12 rounded bg-slate-200" />
            </div>
            <div className="mt-0.5 h-4 w-4 rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RepositoryLinkModalContent({
  step,
  selectedMethod,
  urlInput,
  validationError,
  isSaving,
  hasInputChanged,
  isInputValid,
  onUrlChange,
  onClose,
  onSave,
  onConnectGitHubApp,
  onRequestMoreRepositoryAccess,
  isRequestingMoreRepositoryAccess,
  connectedInstallationId,
  onUseConnectedInstallation,
  repositories,
  selectedRepositoryId,
  isLoadingRepositories,
  repositorySelectionError,
  onSelectRepository,
  onConfirmRepositorySelection,
  onBackToEntry,
  onRetryLoadRepositories,
  hasMoreRepositories,
  totalRepositoryCount,
  isLoadingMoreRepositories,
  onLoadMoreRepositories,
  loadMoreError,
  onSelectMethod,
  onChangeMethod,
}: RepositoryLinkModalContentProps) {
  if (step === 'installation-selection') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <h4 className="text-sm font-semibold text-foreground">Select repository</h4>
          <p className="mt-1 text-xs text-muted-foreground">Select a repository for this project.</p>
        </div>

        {isLoadingRepositories ? (
          <RepositorySelectionSkeleton />
        ) : repositorySelectionError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <p>{repositorySelectionError}</p>
            <div className="mt-3">
              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                onClick={onRetryLoadRepositories}
                disabled={isSaving}
              >
                Retry
              </button>
            </div>
          </div>
        ) : repositories.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-muted-foreground">
            No repositories are available in this installation.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {repositories.map((repository) => {
                const isChecked = selectedRepositoryId === repository.repositoryId;
                return (
                  <label
                    key={repository.repositoryId}
                    className={`block rounded-2xl border p-3 transition-colors ${
                      isChecked
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    } cursor-pointer`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{repository.fullName}</p>
                        <a
                          href={repository.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="mt-1 block text-xs text-sky-700 underline-offset-2 hover:underline"
                        >
                          {repository.url}
                        </a>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Default branch: {repository.defaultBranch || 'main'}
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="github-installation-repository"
                        checked={isChecked}
                        onChange={() => onSelectRepository(repository.repositoryId)}
                        disabled={isSaving || isLoadingMoreRepositories}
                        className="mt-1 h-4 w-4"
                      />
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Showing {repositories.length}
                {totalRepositoryCount != null ? ` of ${totalRepositoryCount}` : ''} repositories.
              </p>
              {loadMoreError ? (
                <p className="text-xs text-rose-600">{loadMoreError}</p>
              ) : null}
              {hasMoreRepositories ? (
                <button
                  type="button"
                  className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                  onClick={onLoadMoreRepositories}
                  disabled={isSaving || isLoadingMoreRepositories}
                >
                  {isLoadingMoreRepositories ? 'Loading more...' : 'Load more'}
                </button>
              ) : null}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={onBackToEntry}
            disabled={isSaving}
          >
            Back
          </button>
          <button
            type="button"
            className={buttonStyles({ variant: 'primary', size: 'sm' })}
            onClick={onConfirmRepositorySelection}
            disabled={
              isSaving ||
              isLoadingRepositories ||
              repositories.length === 0 ||
              selectedRepositoryId == null
            }
          >
            {isSaving ? 'Linking...' : 'Link selected repository'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-[460px]">
      {selectedMethod === null ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-foreground">Choose linking method</p>
          <p className="text-sm text-slate-700">
            Choose how you want to connect a repository to this project.
          </p>
        </div>
      ) : null}

      {selectedMethod === null ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectMethod('url')}
            className="h-full min-h-[160px] rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex h-full flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground leading-6">
                  Link via Repository URL
                </p>
                <span className="inline-flex whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Quick/Public
                </span>
              </div>
              <p className="max-w-[28ch] text-xs leading-6 text-muted-foreground">
                Best for public repositories and quick linking.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectMethod('github_app')}
            className="h-full min-h-[160px] rounded-2xl border border-amber-300 bg-amber-50/60 p-5 text-left transition-all hover:border-amber-400 hover:bg-amber-50"
          >
            <div className="flex h-full flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground leading-6">
                  Link using GitHub App
                </p>
                <span className="inline-flex whitespace-nowrap rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                  Recommended
                </span>
              </div>
              <p className="max-w-[30ch] text-xs leading-6 text-muted-foreground">
                Recommended for private repositories and secure access.
              </p>
            </div>
          </button>
        </section>
      ) : null}

      {selectedMethod === 'url' ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 ease-out">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Method 1 of 2
            </p>
            <h4 className="mt-1 text-sm font-semibold text-foreground">Link via Repository URL</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Use this when the repository is public and you want the fastest setup.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Enter URL in format: <code>https://github.com/owner/repo</code>.
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Need private repository access and secure authorization? Click{' '}
              <span className="font-semibold">Change method</span> and choose GitHub App.
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Repository URL
            </span>
            <input
              value={urlInput}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://github.com/owner/repo"
              className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
              disabled={isSaving}
            />
          </label>

          {validationError ? <p className="text-sm text-rose-600">{validationError}</p> : null}

          <div className="flex flex-wrap justify-between gap-2">
            <button
              type="button"
              className="text-xs font-medium text-sky-700 underline-offset-2 hover:underline"
              onClick={onChangeMethod}
              disabled={isSaving}
            >
              Change method
            </button>
            <button
              type="button"
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
              onClick={onSave}
              disabled={isSaving || !hasInputChanged || !isInputValid}
            >
              {isSaving ? 'Saving...' : 'Save repository link'}
            </button>
          </div>
        </section>
      ) : null}

      {selectedMethod === 'github_app' ? (
        <section className="rounded-2xl border border-border bg-slate-50/70 p-4 transition-all duration-200 ease-out">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Method 2 of 2 (Recommended)
          </p>
          <h4 className="mt-1 text-sm font-semibold text-foreground">Link using GitHub App</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Use this when your repository is private or you need secure project-scoped access.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            If you are the repository owner (or organization admin), click Connect GitHub App.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            If you are not the owner and need access granted, click Request More Repository Access.
            After access is granted on GitHub, come back here and continue linking.
          </p>
          <p className="mt-2 text-xs text-amber-700">
            Grant access only to repositories needed for this project.
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Need a quick public-repository link instead? Click{' '}
            <span className="font-semibold">Change method</span> and choose Repository URL.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="text-xs font-medium text-sky-700 underline-offset-2 hover:underline"
              onClick={onChangeMethod}
              disabled={isSaving || isRequestingMoreRepositoryAccess}
            >
              Change method
            </button>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                onClick={onRequestMoreRepositoryAccess}
                disabled={isSaving || isRequestingMoreRepositoryAccess}
              >
                {isRequestingMoreRepositoryAccess
                  ? 'Preparing request...'
                  : 'Request More Repository Access'}
              </button>
              {connectedInstallationId ? (
                <button
                  type="button"
                  className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                  onClick={() => onUseConnectedInstallation(connectedInstallationId)}
                  disabled={isSaving}
                >
                  Configure repository link
                </button>
              ) : null}
              <button
                type="button"
                className={buttonStyles({ variant: 'primary', size: 'sm' })}
                onClick={onConnectGitHubApp}
                disabled={isSaving}
              >
                <span className="inline-flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <span>Connect GitHub App</span>
                </span>
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
