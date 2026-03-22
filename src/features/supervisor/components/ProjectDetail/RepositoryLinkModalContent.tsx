import { buttonStyles } from '@/components/ui/Button';
import type { GitHubInstallationRepository } from '../../types';

type RepositoryLinkModalContentProps = {
  step: 'entry' | 'installation-selection';
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm text-slate-700">
          Linking by URL works best for public repositories with limited integration scope. For
          private repositories and full secure sync, use GitHub App connection.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Basic repository link</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Use this if your repo is public and URL-based integration is enough.
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

        <p className="text-xs text-muted-foreground">
          Use <code>https://github.com/owner/repo</code>.
        </p>

        {validationError ? <p className="text-sm text-rose-600">{validationError}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
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

      <section className="rounded-2xl border border-border bg-slate-50/70 p-4">
        <h4 className="text-sm font-semibold text-foreground">Advanced: GitHub App integration</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Recommended for private repositories and stronger access control with secure token flow.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Need more repositories than currently visible? Request more repository access first, then
          continue to GitHub and grant only the repositories required for this project.
        </p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
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
            Connect GitHub App
          </button>
        </div>
      </section>
    </div>
  );
}
