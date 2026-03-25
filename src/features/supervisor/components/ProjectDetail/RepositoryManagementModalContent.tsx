import { buttonStyles } from '@/components/ui/Button';
import { Pencil, RefreshCw, Github } from 'lucide-react';

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
  onDisconnectSource: (sourceId: string) => void;
  editingDisplayNameRowKey: string | null;
  editingDisplayNameDraft: string;
  displayNameEditError: string | null;
  isSavingDisplayName: boolean;
  onStartDisplayNameEdit: (row: RepositoryManagementRow) => void;
  onDisplayNameDraftChange: (value: string) => void;
  onCancelDisplayNameEdit: () => void;
  onSaveDisplayNameEdit: (row: RepositoryManagementRow) => void;
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
  onDisconnectSource,
  editingDisplayNameRowKey,
  editingDisplayNameDraft,
  displayNameEditError,
  isSavingDisplayName,
  onStartDisplayNameEdit,
  onDisplayNameDraftChange,
  onCancelDisplayNameEdit,
  onSaveDisplayNameEdit,
}: RepositoryManagementModalContentProps) {
  const linkedLimitReached = linkedCount >= maxLinkedRepositories;
  const enabledLimitReached = enabledCount >= maxEnabledRepositories;
  const bothLimitsReached = linkedLimitReached && enabledLimitReached;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Limits:{' '}
          <span className={linkedLimitReached ? 'font-semibold text-amber-700' : 'font-medium text-foreground'}>
            Linked {linkedCount} / {maxLinkedRepositories}
          </span>
          <span className="px-1.5">·</span>
          <span className={enabledLimitReached ? 'font-semibold text-amber-700' : 'font-medium text-foreground'}>
            Enabled {enabledCount} / {maxEnabledRepositories}
          </span>
        </p>
        {bothLimitsReached ? (
          <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            Linked and enabled limits reached. Unlink one repository and disable one enabled repository to continue.
          </p>
        ) : null}
        {!bothLimitsReached && enabledLimitReached ? (
          <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            Enabled limit reached. Disable one enabled repository before enabling another.
          </p>
        ) : null}
        {!bothLimitsReached && linkedLimitReached ? (
          <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            Linked limit reached. Unlink one repository to add another.
          </p>
        ) : null}
      </div>

      {isLoadingInventory ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-muted-foreground">
          Loading repository access inventory...
        </div>
      ) : inventoryError ? (
        <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-muted-foreground">
          No repositories are available for this project yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left font-medium">Display name</th>
                <th className="px-3 py-3 text-left font-medium">Owner</th>
                <th className="px-3 py-3 text-left font-medium">Access type</th>
                <th className="px-3 py-3 text-left font-medium">Status</th>
                <th className="px-3 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const blockedByEnabledLimit = !row.enabled && remainingEnabledSlots < 1;
                const blockedByLinkedLimit = !row.enabled && !row.linkId && remainingLinkSlots < 1;
                const enableBlocked = blockedByEnabledLimit || blockedByLinkedLimit;
                const isEditingDisplayName = editingDisplayNameRowKey === row.rowKey;
                return (
                  <tr key={row.rowKey} className="align-top">
                    <td className="px-3 py-3 text-xs text-foreground">
                      {row.customName?.trim() || '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground">{row.ownerLogin || 'unknown'}</td>
                    <td className="px-3 py-3 text-xs text-foreground">{formatAccessTypeLabel(row.accessType)}</td>
                    <td className="px-3 py-3">
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Enabled</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={row.enabled}
                            aria-label={row.enabled ? 'Disable repository' : 'Enable repository'}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
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
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Primary</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={row.primary}
                            aria-label={row.primary ? 'Primary repository selected' : 'Set as primary repository'}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
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
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                          {row.url ? (
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noreferrer"
                              title="Open repository"
                              aria-label="Open repository"
                            >
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/20 transition-colors hover:bg-slate-800">
                                <Github className="h-5 w-5" strokeWidth={2.25} />
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
                              <Pencil className="h-5 w-5" strokeWidth={2.25} />
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
                              <RefreshCw className="h-5 w-5" strokeWidth={2.25} />
                            </button>
                          ) : null}

                          {row.sourceId ? (
                            <button
                              type="button"
                              className={buttonStyles({ variant: 'outline', size: 'sm' })}
                              onClick={() => onDisconnectSource(row.sourceId!)}
                              disabled={isMutating || isSavingDisplayName}
                            >
                              Disconnect source
                            </button>
                          ) : null}
                        </div>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
