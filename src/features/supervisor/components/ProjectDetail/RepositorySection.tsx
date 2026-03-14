import { useEffect, useMemo, useState } from 'react';
import { buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
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
  const [initialEditValue, setInitialEditValue] = useState(project.repositoryUrl ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestModal, setRequestModal] = useState<{
    isOpen: boolean;
    status: 'loading' | 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    status: 'loading',
    title: '',
    message: '',
  });

  const hasRepository = Boolean(project.repositoryUrl);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    setUrlInput(project.repositoryUrl ?? '');
    setInitialEditValue(project.repositoryUrl ?? '');
    setValidationError(null);
  }, [project.repositoryUrl, isEditing]);

  const hasInputChanged = useMemo(() => urlInput !== initialEditValue, [initialEditValue, urlInput]);

  const nextRepositoryPayload = useMemo(() => toRepositoryPayload(urlInput), [urlInput]);
  const isInputValid = useMemo(
    () =>
      nextRepositoryPayload === null || isValidGithubRepositoryUrl(nextRepositoryPayload),
    [nextRepositoryPayload],
  );

  function handleStartEdit() {
    const currentValue = project.repositoryUrl ?? '';
    setUrlInput(currentValue);
    setInitialEditValue(currentValue);
    setValidationError(null);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    const currentValue = project.repositoryUrl ?? '';
    setUrlInput(currentValue);
    setInitialEditValue(currentValue);
    setValidationError(null);
    setIsEditing(false);
  }

  function closeRequestModal() {
    setRequestModal((current) => ({ ...current, isOpen: false }));
  }

  async function handleSaveRepository() {
    if (!isInputValid) {
      setValidationError('Please enter a valid GitHub repository URL');
      return;
    }

    const repositoryUrl = nextRepositoryPayload;
    setValidationError(null);

    setIsSaving(true);
    setRequestModal({
      isOpen: true,
      status: 'loading',
      title: 'Updating repository link',
      message: 'Saving GitHub repository settings for this project.',
    });

    try {
      const updatedProject = await supervisorApi.updateRepository(project.id, repositoryUrl);
      onUpdate(updatedProject);
      setIsEditing(false);
      setUrlInput(updatedProject.repositoryUrl ?? '');
      setRequestModal({
        isOpen: true,
        status: 'success',
        title: repositoryUrl ? 'Repository linked' : 'Repository removed',
        message: repositoryUrl
          ? 'GitHub repository URL was saved successfully.'
          : 'GitHub repository URL was removed successfully.',
      });
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to update repository. Please try again.';
      setRequestModal({
        isOpen: true,
        status: 'error',
        title: 'Unable to update repository',
        message: message || 'Unable to update repository. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
      <RequestStateModal
        isOpen={requestModal.isOpen}
        status={requestModal.status}
        title={requestModal.title}
        message={requestModal.message}
        onClose={requestModal.status === 'loading' ? undefined : closeRequestModal}
        onRetry={requestModal.status === 'error' ? () => void handleSaveRepository() : undefined}
      />

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
                const nextValue = event.target.value;
                const nextPayload = toRepositoryPayload(nextValue);
                setUrlInput(nextValue);
                if (nextPayload && !isValidGithubRepositoryUrl(nextPayload)) {
                  setValidationError('Please enter a valid GitHub repository URL');
                } else {
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
              disabled={isSaving || !hasInputChanged || !isInputValid}
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
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          <p className="text-sm text-muted-foreground">No GitHub repository linked yet.</p>
        </div>
      )}
    </section>
  );
}
