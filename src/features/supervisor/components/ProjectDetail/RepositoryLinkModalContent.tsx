import { buttonStyles } from '@/components/ui/Button';

type RepositoryLinkModalContentProps = {
  urlInput: string;
  validationError: string | null;
  isSaving: boolean;
  hasInputChanged: boolean;
  isInputValid: boolean;
  onUrlChange: (nextValue: string) => void;
  onClose: () => void;
  onSave: () => void;
  onConnectGitHubApp: () => void;
};

export function RepositoryLinkModalContent({
  urlInput,
  validationError,
  isSaving,
  hasInputChanged,
  isInputValid,
  onUrlChange,
  onClose,
  onSave,
  onConnectGitHubApp,
}: RepositoryLinkModalContentProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm text-slate-700">
          Linking by URL works best for public repositories with limited integration scope.
          For private repositories and full secure sync, use GitHub App connection.
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
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className={buttonStyles({ variant: 'primary', size: 'sm' })}
            onClick={onConnectGitHubApp}
          >
            Connect GitHub App
          </button>
        </div>
      </section>
    </div>
  );
}

