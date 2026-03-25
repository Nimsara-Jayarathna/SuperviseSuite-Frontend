import { buttonStyles } from '@/components/ui/Button';
import { ExternalLink, Github, Link2, ShieldCheck } from 'lucide-react';
import type { GitHubRepositoryOption } from '../../types';

export type RepositoryLinkMethod =
  | 'PUBLIC_URL'
  | 'INSTALLATION_DIRECT'
  | 'INSTALLATION_REQUESTED';

type RepositoryLinkModalContentProps = {
  step: 'method' | 'repository-selection';
  repositorySelectionEntryMode: 'manual' | 'callback-direct' | 'callback-requested';
  canReturnToMethods: boolean;
  selectedMethod: RepositoryLinkMethod | null;
  onSelectMethod: (method: RepositoryLinkMethod) => void;
  onBackToMethods: () => void;
  publicRepositoryUrl: string;
  publicCustomName: string;
  onChangePublicRepositoryUrl: (value: string) => void;
  onChangePublicCustomName: (value: string) => void;
  onSubmitPublicRepository: () => void;
  isSubmittingPublicRepository: boolean;
  onStartOwnerInstall: () => void;
  isStartingOwnerInstall: boolean;
  onCreateAccessRequest: () => void;
  isCreatingAccessRequest: boolean;
  generatedAccessRequestUrl: string | null;
  generatedAccessRequestExpiresAt: string | null;
  onCopyAccessRequestUrl: () => void;
  isAccessRequestLinkCopied: boolean;
  selectedSourceLabel: string | null;
  availableRepositories: GitHubRepositoryOption[];
  isLoadingAvailableRepositories: boolean;
  availableRepositoriesError: string | null;
  onReloadAvailableRepositories: () => void;
  selectedRepositoryIds: string[];
  primaryRepositoryId: string | null;
  customNameByRepositoryId: Record<string, string>;
  maxSelectableCount: number;
  onToggleRepository: (repositoryId: string) => void;
  onSetPrimaryRepository: (repositoryId: string) => void;
  onCustomNameChange: (repositoryId: string, value: string) => void;
  onConfirmRepositorySelection: () => void;
  isConfirmingRepositorySelection: boolean;
};

function SelectedCountPill({ selected, limit }: { selected: number; limit: number }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
      Selected {selected}
      {limit > 0 ? ` / ${limit}` : ''}
    </span>
  );
}

export function RepositoryLinkModalContent({
  step,
  repositorySelectionEntryMode,
  canReturnToMethods,
  selectedMethod,
  onSelectMethod,
  onBackToMethods,
  publicRepositoryUrl,
  publicCustomName,
  onChangePublicRepositoryUrl,
  onChangePublicCustomName,
  onSubmitPublicRepository,
  isSubmittingPublicRepository,
  onStartOwnerInstall,
  isStartingOwnerInstall,
  onCreateAccessRequest,
  isCreatingAccessRequest,
  generatedAccessRequestUrl,
  generatedAccessRequestExpiresAt,
  onCopyAccessRequestUrl,
  isAccessRequestLinkCopied,
  selectedSourceLabel,
  availableRepositories,
  isLoadingAvailableRepositories,
  availableRepositoriesError,
  onReloadAvailableRepositories,
  selectedRepositoryIds,
  primaryRepositoryId,
  customNameByRepositoryId,
  maxSelectableCount,
  onToggleRepository,
  onSetPrimaryRepository,
  onCustomNameChange,
  onConfirmRepositorySelection,
  isConfirmingRepositorySelection,
}: RepositoryLinkModalContentProps) {
  if (step === 'repository-selection') {
    const sourceDescription = repositorySelectionEntryMode === 'callback-requested'
      ? 'Access request completed. Select repositories to link to this project.'
      : repositorySelectionEntryMode === 'callback-direct'
        ? 'GitHub installation completed. Select repositories to link to this project.'
        : selectedSourceLabel
          ? `Source: ${selectedSourceLabel}`
          : 'Select one or more repositories from this access source.';

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-foreground">Select repositories</p>
          <p className="mt-1 text-xs text-muted-foreground">{sourceDescription}</p>
        </div>

        {maxSelectableCount === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Repository limit reached for this project. Unlink an existing repository to add another one.
          </div>
        ) : null}

        {isLoadingAvailableRepositories ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-muted-foreground">
            Loading available repositories...
          </div>
        ) : availableRepositoriesError ? (
          <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-700">{availableRepositoriesError}</p>
            <button
              type="button"
              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              onClick={onReloadAvailableRepositories}
            >
              Retry
            </button>
          </div>
        ) : availableRepositories.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-muted-foreground">
            No repositories are available under this access source.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Available repositories
              </p>
              <SelectedCountPill selected={selectedRepositoryIds.length} limit={maxSelectableCount} />
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {availableRepositories.map((repository) => {
                const selected = selectedRepositoryIds.includes(repository.id);
                const primary = primaryRepositoryId === repository.id;

                return (
                  <div
                    key={repository.id}
                    className={`rounded-2xl border p-3 ${selected ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onToggleRepository(repository.id)}
                          disabled={
                            isConfirmingRepositorySelection ||
                            (!selected && maxSelectableCount === 0) ||
                            (!selected &&
                              maxSelectableCount > 0 &&
                              selectedRepositoryIds.length >= maxSelectableCount)
                          }
                          className="mt-1 h-4 w-4"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">
                            {repository.fullName}
                          </span>
                          <a
                            href={repository.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
                          >
                            {repository.url}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Owner: {repository.ownerLogin} · Default branch: {repository.defaultBranch || 'main'}
                          </span>
                        </span>
                      </label>

                      {selected ? (
                        <label className="ml-2 inline-flex shrink-0 items-center gap-1 text-xs text-slate-700">
                          <input
                            type="radio"
                            name="primary-repository"
                            checked={primary}
                            onChange={() => onSetPrimaryRepository(repository.id)}
                            disabled={isConfirmingRepositorySelection}
                          />
                          Primary
                        </label>
                      ) : null}
                    </div>

                    {selected ? (
                      <div className="mt-3">
                        <input
                          value={customNameByRepositoryId[repository.id] ?? ''}
                          onChange={(event) => onCustomNameChange(repository.id, event.target.value)}
                          placeholder="Custom display name (optional)"
                          disabled={isConfirmingRepositorySelection}
                          className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-300"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {canReturnToMethods ? (
            <button
              type="button"
              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              onClick={onBackToMethods}
              disabled={isConfirmingRepositorySelection}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className={buttonStyles({ variant: 'primary', size: 'sm' })}
            onClick={onConfirmRepositorySelection}
            disabled={isConfirmingRepositorySelection || selectedRepositoryIds.length === 0}
          >
            {isConfirmingRepositorySelection ? 'Linking...' : 'Link selected repositories'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-foreground">Choose linking method</p>
        <p className="mt-1 text-xs text-muted-foreground">
          PUBLIC URL, direct owner install, or owner-requested install flow.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => onSelectMethod('PUBLIC_URL')}
          className={`rounded-2xl border p-4 text-left ${selectedMethod === 'PUBLIC_URL' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Link2 className="h-4 w-4" />
            Link Public Repository
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Public only. No GitHub App required.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectMethod('INSTALLATION_DIRECT')}
          className={`rounded-2xl border p-4 text-left ${selectedMethod === 'INSTALLATION_DIRECT' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Github className="h-4 w-4" />
            Connect GitHub (Owner)
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Use when you own the repository or org.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectMethod('INSTALLATION_REQUESTED')}
          className={`rounded-2xl border p-4 text-left ${selectedMethod === 'INSTALLATION_REQUESTED' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4" />
            Request Access from Owner
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Generate a secure request link for the owner.
          </p>
        </button>
      </div>

      {selectedMethod === 'PUBLIC_URL' ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Method: Public URL</p>
          <input
            value={publicRepositoryUrl}
            onChange={(event) => onChangePublicRepositoryUrl(event.target.value)}
            placeholder="https://github.com/owner/repo"
            disabled={isSubmittingPublicRepository}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-300"
          />
          <input
            value={publicCustomName}
            onChange={(event) => onChangePublicCustomName(event.target.value)}
            placeholder="Custom display name (optional)"
            disabled={isSubmittingPublicRepository}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-300"
          />
          <div className="flex justify-end">
            <button
              type="button"
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
              onClick={onSubmitPublicRepository}
              disabled={isSubmittingPublicRepository || !publicRepositoryUrl.trim()}
            >
              {isSubmittingPublicRepository ? 'Linking...' : 'Link repository'}
            </button>
          </div>
        </div>
      ) : null}

      {selectedMethod === 'INSTALLATION_DIRECT' ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Method: Owner Install</p>
          <p className="text-xs text-muted-foreground">
            Continue to GitHub. After successful install, you will return directly to repository selection.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
              onClick={onStartOwnerInstall}
              disabled={isStartingOwnerInstall}
            >
              {isStartingOwnerInstall ? 'Redirecting...' : 'Continue to GitHub'}
            </button>
          </div>
        </div>
      ) : null}

      {selectedMethod === 'INSTALLATION_REQUESTED' ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Method: Request Access</p>
          <p className="text-xs text-muted-foreground">
            Generate a secure link and send it to the repository owner.
          </p>

          <div className="flex justify-end">
            <button
              type="button"
              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              onClick={onCreateAccessRequest}
              disabled={isCreatingAccessRequest}
            >
              {isCreatingAccessRequest ? 'Generating...' : 'Generate access request link'}
            </button>
          </div>

          {generatedAccessRequestUrl ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
              <p className="font-semibold text-foreground">Share this link</p>
              <a
                href={generatedAccessRequestUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all text-sky-700 hover:underline"
              >
                {generatedAccessRequestUrl}
              </a>
              {generatedAccessRequestExpiresAt ? (
                <p className="mt-1 text-muted-foreground">
                  Expires at {new Date(generatedAccessRequestExpiresAt).toLocaleString()}
                </p>
              ) : null}
              <div className="mt-2">
                <button
                  type="button"
                  className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                  onClick={onCopyAccessRequestUrl}
                >
                  {isAccessRequestLinkCopied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
