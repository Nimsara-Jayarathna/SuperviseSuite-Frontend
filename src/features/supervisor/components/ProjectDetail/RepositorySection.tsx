import { useEffect, useMemo, useState } from 'react';
import { buttonStyles } from '@/components/ui/Button';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../../api/supervisorApi';
import type { SupervisorProjectDetail } from '../../types';

type RepositorySectionProps = {
  project: SupervisorProjectDetail;
  onUpdate: (updatedProject: SupervisorProjectDetail) => void;
};

const GITHUB_REPOSITORY_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

function toRepositoryPayload(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidGithubRepositoryUrl(value: string): boolean {
  return GITHUB_REPOSITORY_URL_PATTERN.test(value);
}

export function RepositorySection({ project, onUpdate }: RepositorySectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [urlInput, setUrlInput] = useState(project.repositoryUrl ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasRepository = Boolean(project.repositoryUrl);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    setUrlInput(project.repositoryUrl ?? '');
    setValidationError(null);
    setSaveError(null);
  }, [project.repositoryUrl, isEditing]);

  const hasChanges = useMemo(() => {
    const nextPayload = toRepositoryPayload(urlInput);
    const currentPayload = toRepositoryPayload(project.repositoryUrl ?? '');
    return nextPayload !== currentPayload;
  }, [project.repositoryUrl, urlInput]);

  function handleStartEdit() {
    setUrlInput(project.repositoryUrl ?? '');
    setValidationError(null);
    setSaveError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setUrlInput(project.repositoryUrl ?? '');
    setValidationError(null);
    setSaveError(null);
    setIsEditing(false);
  }

  async function handleSaveRepository() {
    const repositoryUrl = toRepositoryPayload(urlInput);

    setValidationError(null);
    setSaveError(null);
    setSuccessMessage(null);

    if (repositoryUrl && !isValidGithubRepositoryUrl(repositoryUrl)) {
      setValidationError('Please enter a valid GitHub repository URL');
      return;
    }

    setIsSaving(true);

    try {
      const updatedProject = await supervisorApi.updateRepository(project.id, repositoryUrl);
      onUpdate(updatedProject);
      setIsEditing(false);
      setUrlInput(updatedProject.repositoryUrl ?? '');
      setSuccessMessage(
        repositoryUrl ? 'Repository link updated successfully.' : 'Repository link removed.',
      );
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to update repository. Please try again.';
      setSaveError(message || 'Unable to update repository. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">GitHub repository</h2>
        {!isEditing ? (
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={handleStartEdit}
          >
            {hasRepository ? 'Edit' : 'Link repository'}
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-5 space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Repository URL
            </span>
            <input
              value={urlInput}
              onChange={(event) => {
                setUrlInput(event.target.value);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              placeholder="https://github.com/owner/repo"
              className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
              disabled={isSaving}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Use <code>https://github.com/owner/repo</code>. Clear the input to remove the linked
            repository.
          </p>

          {validationError ? <p className="text-sm text-rose-600">{validationError}</p> : null}
          {saveError ? <p className="text-sm text-rose-600">{saveError}</p> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
              onClick={() => void handleSaveRepository()}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save repository'}
            </button>
          </div>
        </div>
      ) : hasRepository ? (
        <div className="mt-5 space-y-2">
          <a
            href={project.repositoryUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
          >
            {project.repositoryUrl}
          </a>
          <p className="text-xs text-muted-foreground">
            Supervisors can edit or remove this repository link.
          </p>
          {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          <p className="text-sm text-muted-foreground">No GitHub repository linked yet.</p>
          {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
        </div>
      )}
    </section>
  );
}
