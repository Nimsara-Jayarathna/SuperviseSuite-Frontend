import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import type { GitHubAccessUpdatedSummary } from '../types';

const INVALID_LINK_MESSAGE =
  'This access request link is invalid or has expired. Please create a new access request from the project.';

function toScopeLabel(scope: string | null | undefined, count: number | null | undefined): string {
  if (scope === 'SINGLE_REPOSITORY') {
    return 'Single repository access';
  }
  if (scope === 'MULTIPLE_REPOSITORIES') {
    return `Multiple repositories access${typeof count === 'number' ? ` (${count})` : ''}`;
  }
  if (scope === 'NO_REPOSITORIES') {
    return 'No repositories selected on GitHub';
  }
  return 'Repository access updated';
}

export function GitHubAccessUpdatedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);
  const setupStatus = useMemo(() => searchParams.get('status')?.trim() ?? '', [searchParams]);

  const [summary, setSummary] = useState<GitHubAccessUpdatedSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [title, setTitle] = useState('Finalizing GitHub access update');
  const [message, setMessage] = useState(
    'Verifying callback state and loading updated repository access summary.',
  );
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const showFailedStatus = setupStatus.toLowerCase() === 'failed';

  async function loadSummary() {
    if (!token) {
      setSummary(null);
      setStatus('error');
      setTitle('GitHub access update failed');
      setMessage(INVALID_LINK_MESSAGE);
      return;
    }

    setStatus('loading');
    setTitle('Finalizing GitHub access update');
    setMessage('Verifying callback state and loading updated repository access summary.');

    try {
      const data = await supervisorApi.getPublicGitHubAccessUpdatedSummary(token);
      setSummary(data);
      setStatus('success');
      setTitle('GitHub access updated successfully');
      setMessage(
        'Your available repositories have been refreshed. You can remove repository access anytime from GitHub App settings.',
      );
    } catch (error) {
      const nextMessage = isApiException(error) ? error.apiError.message : INVALID_LINK_MESSAGE;
      setSummary(null);
      setStatus('error');
      setTitle('GitHub access update failed');
      setMessage(nextMessage || INVALID_LINK_MESSAGE);
    }
  }

  useEffect(() => {
    if (showFailedStatus && !token) {
      setSummary(null);
      setStatus('error');
      setTitle('GitHub access update failed');
      setMessage('GitHub authorization did not complete. Please create a new access request.');
      return;
    }
    void loadSummary();
  }, [showFailedStatus, token]);

  async function handleConfirmAndContinue() {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    setIsAcknowledging(true);
    try {
      await supervisorApi.acknowledgePublicGitHubAccessUpdated(token);
    } catch {
      // If acknowledge fails, still continue to avoid trapping user on public callback page.
    } finally {
      setIsAcknowledging(false);
      navigate('/', { replace: true });
    }
  }

  return (
    <div className="min-h-[50vh]">
      <RequestStateModal
        isOpen
        status={status}
        title={title}
        message={message}
        autoCloseOnSuccess={false}
        onClose={status === 'loading' ? undefined : () => navigate('/', { replace: true })}
        onRetry={status === 'error' && token ? () => void loadSummary() : undefined}
        content={
          status === 'success' && summary ? (
            <div className="space-y-3 text-left">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Project</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{summary.projectTitle}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {toScopeLabel(summary.accessScope, summary.accessibleRepositoryCount)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Accessible Repositories
                </p>
                {summary.repositories.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No repositories are currently visible under this installation.
                  </p>
                ) : (
                  <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                    {summary.repositories.map((repository) => (
                      <div
                        key={repository.repositoryId}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-foreground">{repository.fullName}</p>
                        <a
                          href={repository.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-sky-700 underline-offset-2 hover:underline"
                        >
                          {repository.url}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null
        }
        footer={
          status === 'success' ? (
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className={buttonStyles({ variant: 'primary', size: 'md' })}
                onClick={() => void handleConfirmAndContinue()}
                disabled={isAcknowledging}
              >
                {isAcknowledging ? 'Finishing...' : 'Confirm and continue'}
              </button>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
