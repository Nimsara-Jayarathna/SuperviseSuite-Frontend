import { buttonStyles } from '@/components/ui/Button';

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
  remainingSlots: number;
  isMutating: boolean;
  isLoadingInventory: boolean;
  inventoryError: string | null;
  onReloadInventory: () => void;
  onSelectPrimary: (linkId: string) => void;
  onRefresh: (linkId: string) => void;
  onEnableForProject: (row: RepositoryManagementRow) => void;
  onDisableForProject: (linkId: string) => void;
  onDisconnectSource: (sourceId: string) => void;
};

function toSyncLabel(value: string | null | undefined): string {
  if (value === 'SUCCESS') return 'Synced';
  if (value === 'FAILED') return 'Sync failed';
  if (value === 'PENDING') return 'Pending';
  return 'Not linked';
}

export function RepositoryManagementModalContent({
  rows,
  linkedCount,
  maxLinkedRepositories,
  remainingSlots,
  isMutating,
  isLoadingInventory,
  inventoryError,
  onReloadInventory,
  onSelectPrimary,
  onRefresh,
  onEnableForProject,
  onDisableForProject,
  onDisconnectSource,
}: RepositoryManagementModalContentProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-foreground">Repository management</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Linked {linkedCount} / {maxLinkedRepositories} repositories. Manage enablement, primary selection, and source access from one place.
        </p>
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
                <th className="px-3 py-3 text-left font-medium">Enabled</th>
                <th className="px-3 py-3 text-left font-medium">Primary</th>
                <th className="px-3 py-3 text-left font-medium">Display name</th>
                <th className="px-3 py-3 text-left font-medium">Repository</th>
                <th className="px-3 py-3 text-left font-medium">Owner</th>
                <th className="px-3 py-3 text-left font-medium">Access type</th>
                <th className="px-3 py-3 text-left font-medium">Sync</th>
                <th className="px-3 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const enableBlocked = !row.enabled && remainingSlots < 1;
                return (
                  <tr key={row.rowKey} className="align-top">
                    <td className="px-3 py-3">
                      <label className="inline-flex items-center gap-2 text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={() => {
                            if (row.enabled && row.linkId) {
                              onDisableForProject(row.linkId);
                            } else if (!row.enabled) {
                              onEnableForProject(row);
                            }
                          }}
                          disabled={isMutating || (!row.enabled && enableBlocked)}
                        />
                        <span>{row.enabled ? 'Enabled' : 'Disabled'}</span>
                      </label>
                      {!row.enabled && enableBlocked ? (
                        <p className="mt-1 text-[11px] text-amber-700">Limit reached</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      {row.enabled && row.linkId ? (
                        <label className="inline-flex items-center gap-2 text-xs text-foreground">
                          <input
                            type="radio"
                            checked={row.primary}
                            onChange={() => onSelectPrimary(row.linkId!)}
                            disabled={isMutating || row.primary}
                          />
                          <span>{row.primary ? 'Primary' : 'Set primary'}</span>
                        </label>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground">{row.customName?.trim() || '—'}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-foreground">{row.fullName || 'Repository'}</p>
                      {row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block break-all text-xs text-sky-700 hover:underline"
                        >
                          {row.url}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground">{row.ownerLogin || 'unknown'}</td>
                    <td className="px-3 py-3 text-xs text-foreground">{row.accessType}</td>
                    <td className="px-3 py-3 text-xs text-foreground">{toSyncLabel(row.syncStatus)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.enabled && row.linkId ? (
                          <>
                            <button
                              type="button"
                              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                              onClick={() => onRefresh(row.linkId!)}
                              disabled={isMutating}
                            >
                              Refresh
                            </button>
                            <button
                              type="button"
                              className={buttonStyles({ variant: 'danger', size: 'sm' })}
                              onClick={() => onDisableForProject(row.linkId!)}
                              disabled={isMutating}
                            >
                              Disable
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={buttonStyles({ variant: 'primary', size: 'sm' })}
                            onClick={() => onEnableForProject(row)}
                            disabled={isMutating || enableBlocked}
                          >
                            Enable
                          </button>
                        )}

                        {row.sourceId ? (
                          <button
                            type="button"
                            className={buttonStyles({ variant: 'outline', size: 'sm' })}
                            onClick={() => onDisconnectSource(row.sourceId!)}
                            disabled={isMutating}
                          >
                            Disconnect source
                          </button>
                        ) : null}
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
