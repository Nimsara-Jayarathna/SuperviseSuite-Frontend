import { buttonStyles } from '@/components/ui/Button';
import { SyncStatusBadge } from '@/components/ui/SyncStatusBadge';
import { normalizeSyncStatus } from '@/lib/syncStatus';
import { Pencil, RefreshCw, Github, Unlink } from 'lucide-react';
import { RepositoryRowSkeleton } from './RepositoryRowSkeleton';

export type RepositoryManagementRow = {
  rowKey: string;
  sourceId: string | null;
  accessType: string;
  githubRepositoryId: string | null;
  githubRepoId: number | null;
  linkId: string | null;
  enabled: boolean;
  primary: boolean;
  customName: string | null;
  fullName: string | null;
  ownerLogin: string | null;
  url: string | null;
  syncStatus: string | null;
};

type RepositoryManagementModalContentProps = {
  rows: RepositoryManagementRow[];
  linkedCount: number;
  maxLinkedRepositories: number;
  enabledCount: number;
  maxEnabledRepositories: number;
  remainingLinkSlots: number;
  remainingEnabledSlots: number;
  isMutating: boolean;
  isLoadingInventory: boolean;
  inventoryError: string | null;
  onReloadInventory: () => void;
  onSelectPrimary: (linkId: string) => void;
  onRefresh: (linkId: string) => void;
  onToggleEnabled: (row: RepositoryManagementRow) => void;
  onUnlinkRepository: (linkId: string) => void;
  onDisconnectSource: (sourceId: string) => void;
  isSavingDisplayName: boolean;
  onStartDisplayNameEdit: (row: RepositoryManagementRow) => void;
};

function formatAccessTypeLabel(value: string | null | undefined): string {
  const normalized = (value ?? '').trim();
  if (!normalized) {
    return 'Unknown';
  }
  return normalized
    .toLowerCase()
    .split('_')
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export function RepositoryManagementModalContent({
  rows,
  linkedCount,
  maxLinkedRepositories,
  enabledCount,
  maxEnabledRepositories,
  remainingLinkSlots,
  remainingEnabledSlots,
  isMutating,
  isLoadingInventory,
  inventoryError,
  onReloadInventory,
  onSelectPrimary,
  onRefresh,
  onToggleEnabled,
  onUnlinkRepository,
  onDisconnectSource,
  isSavingDisplayName,
  onStartDisplayNameEdit,
}: RepositoryManagementModalContentProps) {
  const linkedLimitReached = linkedCount >= maxLinkedRepositories;
  const enabledLimitReached = enabledCount >= maxEnabledRepositories;
  const bothLimitsReached = linkedLimitReached && enabledLimitReached;
  const sourceHasSyncInProgress = rows.reduce<Record<string, boolean>>((acc, row) => {
    if (!row.sourceId || !row.linkId) {
      return acc;
    }
    if (normalizeSyncStatus(row.syncStatus) === 'IN_PROGRESS') {
      acc[row.sourceId] = true;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Linked repositories</span>
              <span
                className={
                  linkedLimitReached ? 'font-bold text-amber-600' : 'font-medium text-slate-500'
                }
              >
                {linkedCount} / {maxLinkedRepositories}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${linkedLimitReached ? 'bg-amber-500' : 'bg-sky-500'}`}
                style={{ width: `${Math.min(100, (linkedCount / maxLinkedRepositories) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Enabled active</span>
              <span
                className={
                  enabledLimitReached ? 'font-bold text-amber-600' : 'font-medium text-slate-500'
                }
              >
                {enabledCount} / {maxEnabledRepositories}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${enabledLimitReached ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{
                  width: `${Math.min(100, (enabledCount / maxEnabledRepositories) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {bothLimitsReached ? (
          <p className="mt-5 inline-flex items-center rounded-full bg-amber-50 px-3.5 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
            Linked and enabled limits reached. Unlink one repository and disable one enabled
            repository to continue.
          </p>
        ) : null}
        {!bothLimitsReached && enabledLimitReached ? (
          <p className="mt-5 inline-flex items-center rounded-full bg-amber-50 px-3.5 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
            Enabled limit reached. Disable one enabled repository before enabling another.
          </p>
        ) : null}
        {!bothLimitsReached && linkedLimitReached ? (
          <p className="mt-5 inline-flex items-center rounded-full bg-amber-50 px-3.5 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
            Linked limit reached. Unlink one repository to add another.
          </p>
        ) : null}
      </div>

      {isLoadingInventory ? (
        <>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`repo-mobile-skeleton-${index}`}
                className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 text-left font-medium">Display name</th>
                  <th className="px-5 py-4 text-left font-medium">Owner</th>
                  <th className="px-5 py-4 text-left font-medium whitespace-nowrap">Access type</th>
                  <th className="px-5 py-4 text-left font-medium">Status</th>
                  <th className="px-5 py-4 text-center font-medium">Actions</th>
                  <th className="px-5 py-4 text-center font-medium">Danger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 3 }).map((_, index) => (
                  <RepositoryRowSkeleton key={`repo-row-skeleton-${index}`} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : inventoryError ? (
        <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm text-rose-700">{inventoryError}</p>
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={onReloadInventory}
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
          No repositories are available for this project yet.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((row) => {
              const normalizedSyncStatus = normalizeSyncStatus(row.syncStatus);
              const isSyncing = normalizedSyncStatus === 'IN_PROGRESS';
              const blockedByEnabledLimit = !row.enabled && remainingEnabledSlots < 1;
              const blockedByLinkedLimit = !row.enabled && !row.linkId && remainingLinkSlots < 1;
              const enableBlocked = blockedByEnabledLimit || blockedByLinkedLimit;
              const sourceSyncing = !!(row.sourceId && sourceHasSyncInProgress[row.sourceId]);

              return (
                <article
                  key={`mobile-${row.rowKey}`}
                  className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all ${
                    !row.enabled ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {row.customName?.trim() || 'Unnamed repository'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {row.ownerLogin || 'unknown'}
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <SyncStatusBadge syncStatus={normalizedSyncStatus} mode="sync" />
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Access type
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatAccessTypeLabel(row.accessType)}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Enabled
                      </p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={row.enabled}
                        aria-label={row.enabled ? 'Disable repository' : 'Enable repository'}
                        className={`mt-2 relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                          row.enabled
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-slate-300 bg-slate-200'
                        } ${isMutating || enableBlocked ? 'cursor-not-allowed opacity-50' : ''}`}
                        onClick={() => onToggleEnabled(row)}
                        disabled={
                          isMutating ||
                          enableBlocked ||
                          (!row.enabled && (!row.sourceId || !row.githubRepositoryId))
                        }
                        title={
                          blockedByEnabledLimit
                            ? 'Enabled limit reached. Disable one enabled repository first.'
                            : blockedByLinkedLimit
                              ? 'Linked repository limit reached. Unlink one repository first.'
                              : row.enabled
                                ? 'Disable for project'
                                : 'Enable for project'
                        }
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            row.enabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Primary
                      </p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={row.primary}
                        aria-label={
                          row.primary ? 'Primary repository selected' : 'Set as primary repository'
                        }
                        className={`mt-2 relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                          row.primary
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-slate-300 bg-slate-200'
                        } ${
                          isMutating || !row.enabled || !row.linkId || row.primary
                            ? 'cursor-not-allowed opacity-50'
                            : ''
                        }`}
                        onClick={() => {
                          if (!row.linkId || !row.enabled || row.primary) {
                            return;
                          }
                          onSelectPrimary(row.linkId);
                        }}
                        disabled={isMutating || !row.enabled || !row.linkId || row.primary}
                        title={row.primary ? 'Current primary' : 'Set as primary'}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            row.primary ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open repository"
                        aria-label="Open repository"
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/20 transition-colors hover:bg-slate-800">
                          <Github className="h-4 w-4" strokeWidth={2.25} />
                        </span>
                      </a>
                    ) : null}

                    {row.linkId ? (
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        onClick={() => onStartDisplayNameEdit(row)}
                        disabled={isMutating || isSavingDisplayName}
                        title="Edit display name"
                        aria-label="Edit display name"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2.25} />
                      </button>
                    ) : null}

                    {row.enabled && row.linkId ? (
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        onClick={() => onRefresh(row.linkId!)}
                        disabled={isMutating || isSavingDisplayName}
                        title="Refresh repository"
                        aria-label="Refresh repository"
                      >
                        <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
                      </button>
                    ) : null}

                    {row.linkId ? (
                      <button
                        type="button"
                        className={`ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors ${
                          isSyncing
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            : 'border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                        }`}
                        onClick={() => onUnlinkRepository(row.linkId!)}
                        disabled={isMutating || isSavingDisplayName || isSyncing}
                        title={
                          isSyncing
                            ? 'Cannot unlink while repository sync is in progress.'
                            : 'Unlink this repository'
                        }
                        aria-label="Unlink this repository"
                      >
                        <Unlink className="h-4 w-4" strokeWidth={2.25} />
                      </button>
                    ) : row.sourceId ? (
                      <button
                        type="button"
                        className={`ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors ${
                          sourceSyncing
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            : 'border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                        }`}
                        onClick={() => onDisconnectSource(row.sourceId!)}
                        disabled={isMutating || isSavingDisplayName || sourceSyncing}
                        title={
                          sourceSyncing
                            ? 'Cannot disconnect source while any linked repository sync is in progress.'
                            : 'Disconnect source completely (removes all links from this source)'
                        }
                        aria-label="Disconnect source completely"
                      >
                        <Unlink className="h-4 w-4" strokeWidth={2.25} />
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 text-left font-medium">Display name</th>
                  <th className="px-5 py-4 text-left font-medium">Owner</th>
                  <th className="px-5 py-4 text-left font-medium whitespace-nowrap">Access type</th>
                  <th className="px-5 py-4 text-left font-medium">Status</th>
                  <th className="px-5 py-4 text-center font-medium">Actions</th>
                  <th className="px-5 py-4 text-center font-medium">Danger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const normalizedSyncStatus = normalizeSyncStatus(row.syncStatus);
                  const isSyncing = normalizedSyncStatus === 'IN_PROGRESS';
                  const blockedByEnabledLimit = !row.enabled && remainingEnabledSlots < 1;
                  const blockedByLinkedLimit =
                    !row.enabled && !row.linkId && remainingLinkSlots < 1;
                  const enableBlocked = blockedByEnabledLimit || blockedByLinkedLimit;
                  const sourceSyncing = !!(row.sourceId && sourceHasSyncInProgress[row.sourceId]);

                  return (
                    <tr
                      key={row.rowKey}
                      className={`align-middle transition-all duration-300 ${
                        !row.enabled ? 'bg-slate-50/50 opacity-60 grayscale-[0.2]' : ''
                      }`}
                    >
                      <td className="px-5 py-4.5 text-sm font-medium text-foreground">
                        {row.customName?.trim() || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-5 py-4.5 text-sm text-slate-600">
                        {row.ownerLogin || 'unknown'}
                      </td>
                      <td className="px-5 py-4.5 text-sm text-slate-600">
                        {formatAccessTypeLabel(row.accessType)}
                      </td>
                      <td className="px-5 py-4.5">
                        <div className="flex flex-col gap-3 py-1 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-14 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              Enabled
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={row.enabled}
                              aria-label={row.enabled ? 'Disable repository' : 'Enable repository'}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                                row.enabled
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-slate-300 bg-slate-200'
                              } ${isMutating || enableBlocked ? 'cursor-not-allowed opacity-50' : ''}`}
                              onClick={() => onToggleEnabled(row)}
                              disabled={
                                isMutating ||
                                enableBlocked ||
                                (!row.enabled && (!row.sourceId || !row.githubRepositoryId))
                              }
                              title={
                                blockedByEnabledLimit
                                  ? 'Enabled limit reached. Disable one enabled repository first.'
                                  : blockedByLinkedLimit
                                    ? 'Linked repository limit reached. Unlink one repository first.'
                                    : row.enabled
                                      ? 'Disable for project'
                                      : 'Enable for project'
                              }
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                  row.enabled ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="w-14 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              Primary
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={row.primary}
                              aria-label={
                                row.primary
                                  ? 'Primary repository selected'
                                  : 'Set as primary repository'
                              }
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                                row.primary
                                  ? 'border-amber-500 bg-amber-500'
                                  : 'border-slate-300 bg-slate-200'
                              } ${
                                isMutating || !row.enabled || !row.linkId || row.primary
                                  ? 'cursor-not-allowed opacity-50'
                                  : ''
                              }`}
                              onClick={() => {
                                if (!row.linkId || !row.enabled || row.primary) {
                                  return;
                                }
                                onSelectPrimary(row.linkId);
                              }}
                              disabled={isMutating || !row.enabled || !row.linkId || row.primary}
                              title={row.primary ? 'Current primary' : 'Set as primary'}
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                  row.primary ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="w-14 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              Sync
                            </span>
                            <div className="pt-0.5">
                              <SyncStatusBadge syncStatus={normalizedSyncStatus} mode="sync" />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4.5">
                        <div className="flex flex-nowrap items-center justify-center gap-3 whitespace-nowrap">
                          {row.url ? (
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open repository"
                              aria-label="Open repository"
                            >
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/20 transition-colors hover:bg-slate-800">
                                <Github className="h-4 w-4" strokeWidth={2.25} />
                              </span>
                            </a>
                          ) : null}

                          {row.linkId ? (
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                              onClick={() => onStartDisplayNameEdit(row)}
                              disabled={isMutating || isSavingDisplayName}
                              title="Edit display name"
                              aria-label="Edit display name"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2.25} />
                            </button>
                          ) : null}

                          {row.enabled && row.linkId ? (
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                              onClick={() => onRefresh(row.linkId!)}
                              disabled={isMutating || isSavingDisplayName}
                              title="Refresh repository"
                              aria-label="Refresh repository"
                            >
                              <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4.5 text-center">
                        {row.linkId ? (
                          <button
                            type="button"
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors ${
                              isSyncing
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                : 'border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                            }`}
                            onClick={() => onUnlinkRepository(row.linkId!)}
                            disabled={isMutating || isSavingDisplayName || isSyncing}
                            title={
                              isSyncing
                                ? 'Cannot unlink while repository sync is in progress.'
                                : 'Unlink this repository'
                            }
                            aria-label="Unlink this repository"
                          >
                            <Unlink className="h-4 w-4" strokeWidth={2.25} />
                          </button>
                        ) : row.sourceId ? (
                          <button
                            type="button"
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors ${
                              sourceSyncing
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                : 'border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                            }`}
                            onClick={() => onDisconnectSource(row.sourceId!)}
                            disabled={isMutating || isSavingDisplayName || sourceSyncing}
                            title={
                              sourceSyncing
                                ? 'Cannot disconnect source while any linked repository sync is in progress.'
                                : 'Disconnect source completely (removes all links from this source)'
                            }
                            aria-label="Disconnect source completely"
                          >
                            <Unlink className="h-4 w-4" strokeWidth={2.25} />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
