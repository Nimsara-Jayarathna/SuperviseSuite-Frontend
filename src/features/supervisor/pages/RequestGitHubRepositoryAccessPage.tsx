import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';
import type { GitHubRepositoryAccessRequestValidation } from '../types';

const INVALID_LINK_MESSAGE =
  'This access request link is invalid or has expired. Please create a new access request from the project.';

export function RequestGitHubRepositoryAccessPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);

  const [isLoading, setIsLoading] = useState(true);
  const [isContinuing, setIsContinuing] = useState(false);
  const [validation, setValidation] = useState<GitHubRepositoryAccessRequestValidation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setValidation(null);
      setErrorMessage(INVALID_LINK_MESSAGE);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await supervisorApi.validatePublicGitHubRepositoryAccessRequest(token);
        if (!isMounted) {
          return;
        }
        setValidation(data);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const message = isApiException(error) ? error.apiError.message : INVALID_LINK_MESSAGE;
        setValidation(null);
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleContinue() {
    if (!token) {
      setErrorMessage(INVALID_LINK_MESSAGE);
      return;
    }

    setIsContinuing(true);
    setErrorMessage(null);

    try {
      const data = await supervisorApi.continuePublicGitHubRepositoryAccessRequest(token);
      if (!data.githubAuthorizeUrl) {
        setErrorMessage('GitHub authorization URL could not be prepared. Please try again.');
        return;
      }
      window.location.assign(data.githubAuthorizeUrl);
    } catch (error) {
      const message = isApiException(error)
        ? error.apiError.message
        : 'Unable to continue to GitHub right now. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsContinuing(false);
    }
  }

  const backHref = '/';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <section className="rounded-3xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Request More Repository Access</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          You are about to continue to GitHub to update repository access for this project.
        </p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Please grant access only to the repositories you want to use with this project.
        </p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          You can remove access at any time from GitHub App settings.
        </p>

        {isLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-64 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-48 rounded bg-slate-200" />
          </div>
        ) : errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : validation ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project</p>
            <p className="mt-1 text-sm font-medium text-foreground">{validation.projectTitle}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Request expires at {new Date(validation.expiresAt).toLocaleString()}
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-end gap-2">
          <Link to={backHref} className={buttonStyles({ variant: 'secondary', size: 'md' })}>
            Back
          </Link>
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={isLoading || Boolean(errorMessage) || !validation || isContinuing}
            className={buttonStyles({ variant: 'primary', size: 'md' })}
          >
            {isContinuing ? 'Redirecting...' : 'Continue to GitHub'}
          </button>
        </div>
      </section>
    </div>
  );
}
