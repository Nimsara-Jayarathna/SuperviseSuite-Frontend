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
  connectedInstallationId: number | null;
  onUseConnectedInstallation: (installationId: number) => void;
  installationId: number | null;
  repositories: GitHubInstallationRepository[];
  selectedRepositoryId: number | null;
  isLoadingRepositories: boolean;
  repositorySelectionError: string | null;
  onSelectRepository: (repositoryId: number) => void;
  onConfirmRepositorySelection: () => void;
  onBackToEntry: () => void;
};

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
  connectedInstallationId,
  onUseConnectedInstallation,
  installationId,
  repositories,
  selectedRepositoryId,
  isLoadingRepositories,
  repositorySelectionError,
  onSelectRepository,
  onConfirmRepositorySelection,
  onBackToEntry,
}: RepositoryLinkModalContentProps) {
  if (step === 'installation-selection') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <h4 className="text-sm font-semibold text-foreground">Select repository</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose exactly one repository for this project under installation{' '}
            <span className="font-medium text-foreground">#{installationId}</span>.
          </p>
        </div>

        {repositorySelectionError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {repositorySelectionError}
          </div>
        ) : null}

        {isLoadingRepositories ? (
          <p className="text-sm text-muted-foreground">Loading repositories...</p>
        ) : repositories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No repositories are available in this installation.
          </p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {repositories.map((repository) => {
              const isDisabled = repository.alreadyLinked;
              const isChecked = selectedRepositoryId === repository.repositoryId;
              return (
                <label
                  key={repository.repositoryId}
                  className={`block rounded-2xl border p-3 transition-colors ${
                    isChecked
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  } ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
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
                      {repository.alreadyLinked ? (
                        <p className="mt-1 text-xs font-medium text-rose-700">
                          Already linked{repository.linkedProjectId ? ` to project ${repository.linkedProjectId}` : ''}
                        </p>
                      ) : null}
                    </div>
                    <input
                      type="radio"
                      name="github-installation-repository"
                      checked={isChecked}
                      onChange={() => onSelectRepository(repository.repositoryId)}
                      disabled={isDisabled || isSaving}
                      className="mt-1 h-4 w-4"
                    />
                  </div>
                </label>
              );
            })}
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
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {connectedInstallationId ? (
            <button
              type="button"
              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              onClick={() => onUseConnectedInstallation(connectedInstallationId)}
              disabled={isSaving}
            >
              Select repository from installation #{connectedInstallationId}
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
