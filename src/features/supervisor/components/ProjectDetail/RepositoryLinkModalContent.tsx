import { buttonStyles } from '@/components/ui/Button';
import {
  ExternalLink,
  Github,
  Link2,
  ShieldCheck,
  Info,
  Check,
  Copy,
  RefreshCw,
  Search,
  ArrowRight,
  Crown,
} from 'lucide-react';
import type { GitHubRepositoryOption } from '../../types';

export type RepositoryLinkMethod = 'PUBLIC_URL' | 'INSTALLATION_DIRECT' | 'INSTALLATION_REQUESTED';

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
  selectionLimitMessage?: string | null;
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
  selectionLimitMessage,
  onToggleRepository,
  onSetPrimaryRepository,
  onCustomNameChange,
  onConfirmRepositorySelection,
  isConfirmingRepositorySelection,
}: RepositoryLinkModalContentProps) {
  if (step === 'repository-selection') {
    const sourceDescription =
      repositorySelectionEntryMode === 'callback-requested'
        ? 'Access request completed. Select repositories to link.'
        : repositorySelectionEntryMode === 'callback-direct'
          ? 'GitHub installation completed. Select repositories to link.'
          : selectedSourceLabel
            ? `Connected Source: ${selectedSourceLabel}`
            : 'Select one or more repositories from this source.';

    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Search className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Select Repositories</p>
              <p className="text-[10px] font-bold text-indigo-500/70">{sourceDescription}</p>
            </div>
          </div>
        </div>

        {maxSelectableCount === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2">
            <Info className="h-5 w-5 shrink-0 text-amber-500" />
            <p>
              {selectionLimitMessage ??
                'Repository limit reached. Remove an existing repository to add another.'}
            </p>
          </div>
        ) : null}

        {isLoadingAvailableRepositories ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-100 bg-white p-12 text-sm font-bold text-slate-400 shadow-sm">
            <RefreshCw className="mr-3 h-5 w-5 animate-spin text-indigo-400" />
            Loading available repositories...
          </div>
        ) : availableRepositoriesError ? (
          <div className="space-y-4 rounded-3xl border border-rose-100 bg-rose-50 p-6 shadow-sm">
            <p className="text-sm font-bold text-rose-700">{availableRepositoriesError}</p>
            <button
              type="button"
              className={buttonStyles({
                variant: 'secondary',
                size: 'sm',
                className: 'rounded-xl',
              })}
              onClick={onReloadAvailableRepositories}
            >
              Retry
            </button>
          </div>
        ) : availableRepositories.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-12 text-center text-slate-400 shadow-sm">
            <Github className="mx-auto h-10 w-10 opacity-20" />
            <p className="mt-4 text-sm font-bold">No repositories available here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Available repositories
              </p>
              <SelectedCountPill
                selected={selectedRepositoryIds.length}
                limit={maxSelectableCount}
              />
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {availableRepositories.map((repository) => {
                const selected = selectedRepositoryIds.includes(repository.id);
                const primary = primaryRepositoryId === repository.id;
                const blockedBySelectionLimit =
                  !selected &&
                  maxSelectableCount > 0 &&
                  selectedRepositoryIds.length >= maxSelectableCount;
                const selectionBlocked =
                  isConfirmingRepositorySelection ||
                  (!selected && maxSelectableCount === 0) ||
                  blockedBySelectionLimit;

                return (
                  <div
                    key={repository.id}
                    role="button"
                    tabIndex={selectionBlocked ? -1 : 0}
                    onClick={() => {
                      if (selectionBlocked) {
                        return;
                      }
                      onToggleRepository(repository.id);
                    }}
                    onKeyDown={(event) => {
                      if (selectionBlocked) {
                        return;
                      }
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onToggleRepository(repository.id);
                      }
                    }}
                    className={`relative overflow-hidden rounded-3xl border p-4 transition-all ${
                      selected
                        ? 'border-indigo-100 bg-indigo-50/20 shadow-sm'
                        : blockedBySelectionLimit
                          ? 'border-slate-100 bg-slate-50/70 opacity-55'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
                    } ${selectionBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex shrink-0 items-center justify-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (selectionBlocked) {
                              return;
                            }
                            onToggleRepository(repository.id);
                          }}
                          disabled={selectionBlocked}
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                            selected
                              ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                              : blockedBySelectionLimit
                                ? 'border-slate-200 bg-slate-100 text-slate-300'
                                : 'border-slate-200 bg-white hover:border-indigo-400'
                          }`}
                        >
                          {selected && <Check className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <span className="block truncate text-sm font-black text-slate-800">
                            {repository.fullName}
                          </span>
                          {selected ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onSetPrimaryRepository(repository.id);
                              }}
                              disabled={isConfirmingRepositorySelection}
                              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                                primary
                                  ? 'border-amber-200 bg-amber-100 text-amber-700 shadow-sm shadow-amber-50'
                                  : 'border-slate-200 bg-white text-slate-400 hover:border-amber-300 hover:text-amber-600'
                              }`}
                            >
                              {primary ? (
                                <Crown className="h-3 w-3" />
                              ) : (
                                <div className="h-3 w-3 rounded-full border border-slate-200" />
                              )}
                              {primary ? 'Primary (click to unset)' : 'Set primary'}
                            </button>
                          ) : null}
                        </div>

                        <a
                          href={repository.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                        >
                          {repository.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>

                        <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                            {repository.ownerLogin}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                            {repository.defaultBranch || 'unknown'}
                          </span>
                        </div>

                        {selected && (
                          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <input
                              value={customNameByRepositoryId[repository.id] ?? ''}
                              onChange={(event) =>
                                onCustomNameChange(repository.id, event.target.value)
                              }
                              onClick={(event) => event.stopPropagation()}
                              placeholder="Set a custom display name..."
                              disabled={isConfirmingRepositorySelection}
                              className="h-10 w-full rounded-2xl border border-indigo-100 bg-white px-4 text-sm font-medium outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4">
          {canReturnToMethods ? (
            <button
              type="button"
              className={buttonStyles({
                variant: 'secondary',
                size: 'md',
                className: 'rounded-2xl px-8 font-bold',
              })}
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
            className={buttonStyles({
              variant: 'primary',
              size: 'md',
              className: 'rounded-2xl px-10 font-bold shadow-lg shadow-indigo-100',
            })}
            onClick={onConfirmRepositorySelection}
            disabled={isConfirmingRepositorySelection || selectedRepositoryIds.length === 0}
          >
            {isConfirmingRepositorySelection ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isConfirmingRepositorySelection ? 'Linking...' : 'Link Selected'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-1">
      <div className="mb-6 flex flex-col items-center text-center">
        <h3 className="text-xl font-black tracking-tight text-slate-800">Connection Method</h3>
        <p className="mt-1 text-xs font-bold text-slate-400">
          Choose how you want to link your GitHub projects
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: 'INSTALLATION_DIRECT',
            icon: Github,
            color: 'indigo',
            title: 'Connect GitHub',
            subtitle: 'RECOMMENDED',
            description: 'Link from your account or organizations.',
          },
          {
            id: 'PUBLIC_URL',
            icon: Link2,
            color: 'amber',
            title: 'Public URL',
            subtitle: 'NO AUTH',
            description: 'Quickly link any public repo via URL.',
          },
          {
            id: 'INSTALLATION_REQUESTED',
            icon: ShieldCheck,
            color: 'slate',
            title: 'Request Access',
            subtitle: 'SECURE',
            description: 'Generate a link for the project owner.',
          },
        ].map((method) => {
          const isSelected = selectedMethod === method.id;
          const Icon = method.icon;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id as RepositoryLinkMethod)}
              className={`group relative flex flex-col items-center p-5 text-center transition-all rounded-3xl border ${
                isSelected
                  ? `border-${method.color}-200 bg-${method.color}-50/30 ring-4 ring-${method.color}-50`
                  : 'border-slate-100 bg-white hover:border-indigo-100 hover:shadow-lg'
              }`}
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110 duration-300 ${
                  isSelected
                    ? `bg-${method.color}-100 text-${method.color}-600`
                    : `bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600`
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <span
                className={`text-[10px] font-black uppercase tracking-[0.15em] opacity-60 ${
                  isSelected ? `text-${method.color}-600` : 'text-slate-400'
                }`}
              >
                {method.subtitle}
              </span>
              <h4 className="mt-1 text-sm font-black tracking-tight text-slate-800">
                {method.title}
              </h4>
              <p className="mt-2 text-[10px] font-bold leading-relaxed text-slate-400 line-clamp-2">
                {method.description}
              </p>

              {isSelected && (
                <div
                  className={`absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-${method.color}-500 text-white shadow-sm`}
                >
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {selectedMethod === 'PUBLIC_URL' && (
          <div className="overflow-hidden rounded-3xl border border-amber-100 bg-amber-50/20 p-6 shadow-sm">
            <h5 className="flex items-center gap-2 text-[10px] font-black text-amber-900 uppercase tracking-widest">
              <Link2 className="h-3.5 w-3.5" />
              Public URL Details
            </h5>
            <div className="mt-4 flex flex-col gap-3">
              <div className="space-y-1.5">
                <label className="ml-1 text-[9px] font-black uppercase tracking-widest text-amber-700/60">
                  Repository URL
                </label>
                <input
                  value={publicRepositoryUrl}
                  onChange={(event) => onChangePublicRepositoryUrl(event.target.value)}
                  placeholder="https://github.com/owner/repo"
                  disabled={isSubmittingPublicRepository}
                  className="h-10 w-full rounded-2xl border border-amber-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 text-[9px] font-black uppercase tracking-widest text-amber-700/60">
                  Display Name (Optional)
                </label>
                <input
                  value={publicCustomName}
                  onChange={(event) => onChangePublicCustomName(event.target.value)}
                  placeholder="e.g. My Awesome Project"
                  disabled={isSubmittingPublicRepository}
                  className="h-10 w-full rounded-2xl border border-amber-100 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className={buttonStyles({
                  variant: 'primary',
                  size: 'sm',
                  className:
                    'rounded-xl px-8 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100 text-[10px] font-black uppercase tracking-wider',
                })}
                onClick={onSubmitPublicRepository}
                disabled={isSubmittingPublicRepository || !publicRepositoryUrl.trim()}
              >
                {isSubmittingPublicRepository ? (
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="mr-2 h-3.5 w-3.5" />
                )}
                Link Repository
              </button>
            </div>
          </div>
        )}

        {selectedMethod === 'INSTALLATION_DIRECT' && (
          <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50/20 p-6 shadow-sm">
            <h5 className="flex items-center gap-2 text-[10px] font-black text-indigo-900 uppercase tracking-widest">
              <Github className="h-3.5 w-3.5" />
              Direct Owner Install
            </h5>
            <p className="mt-3 text-xs font-bold text-indigo-700/70 leading-relaxed">
              Redirecting to GitHub to install our companion app. You'll return here to pick your
              repos.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className={buttonStyles({
                  variant: 'primary',
                  size: 'sm',
                  className:
                    'rounded-xl px-8 shadow-lg shadow-indigo-100 text-[10px] font-black uppercase tracking-wider',
                })}
                onClick={onStartOwnerInstall}
                disabled={isStartingOwnerInstall}
              >
                {isStartingOwnerInstall ? (
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-3.5 w-3.5" />
                )}
                Continue to GitHub
              </button>
            </div>
          </div>
        )}

        {selectedMethod === 'INSTALLATION_REQUESTED' && (
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
            <h5 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              Access Request
            </h5>
            <p className="mt-3 text-xs font-bold text-slate-500/70 leading-relaxed">
              Generate a secure link for the project owner to approve access automatically.
            </p>

            <div className="mt-6 flex justify-end">
              {!generatedAccessRequestUrl && (
                <button
                  type="button"
                  className={buttonStyles({
                    variant: 'primary',
                    size: 'sm',
                    className:
                      'rounded-xl px-8 shadow-lg shadow-slate-200 text-[10px] font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-900',
                  })}
                  onClick={onCreateAccessRequest}
                  disabled={isCreatingAccessRequest}
                >
                  {isCreatingAccessRequest ? (
                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-3.5 w-3.5" />
                  )}
                  Generate Request
                </button>
              )}
            </div>

            {generatedAccessRequestUrl && (
              <div className="mt-5 animate-in zoom-in-95 duration-300">
                <div className="rounded-2xl bg-white p-5 shadow-inner ring-1 ring-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Share Link
                    </p>
                    {generatedAccessRequestExpiresAt && (
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">
                        EXP: {new Date(generatedAccessRequestExpiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-center gap-3 rounded-xl bg-slate-50 p-3 font-mono text-[10px] text-slate-600 break-all select-all">
                    {generatedAccessRequestUrl}
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      className={buttonStyles({
                        variant: 'primary',
                        size: 'sm',
                        className:
                          'rounded-xl px-8 shadow-lg shadow-indigo-100 text-[10px] font-black uppercase tracking-wider',
                      })}
                      onClick={onCopyAccessRequestUrl}
                    >
                      {isAccessRequestLinkCopied ? (
                        <Check className="mr-2 h-3.5 w-3.5" />
                      ) : (
                        <Copy className="mr-2 h-3.5 w-3.5" />
                      )}
                      {isAccessRequestLinkCopied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
