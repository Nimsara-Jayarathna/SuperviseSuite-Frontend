import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { isApiException } from '@/services/apiClient';
import { AlertTriangle, CheckCircle2, ExternalLink, FolderGit2, Github, ShieldCheck } from 'lucide-react';
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
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50 to-transparent" />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Project-Scoped Access Update
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Request More Repository Access
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            You are about to continue to GitHub to update repository access for this project.
            Choose only the repositories needed for this specific project. You can remove access
            later anytime from GitHub App settings.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <FolderGit2 className="h-4 w-4" />
                Step 1
              </div>
              <p className="mt-2 text-sm text-slate-700">
                Continue to GitHub authorization from this page.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <CheckCircle2 className="h-4 w-4" />
                Step 2
              </div>
              <p className="mt-2 text-sm text-slate-700">
                Select only repositories required for this project.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                Step 3
              </div>
              <p className="mt-2 text-sm text-slate-700">
                Return to SuperviseSuite and configure one repository.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 animate-pulse">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="mt-3 h-3 w-64 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-52 rounded bg-slate-200" />
            </div>
          ) : errorMessage ? (
            <div className="mt-7 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold text-rose-700">Unable to continue</p>
                  <p className="mt-1 text-sm text-rose-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          ) : validation ? (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project</p>
              <p className="mt-2 text-base font-semibold text-foreground">{validation.projectTitle}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                This secure request link expires at {new Date(validation.expiresAt).toLocaleString()}.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                On GitHub, use “Only select repositories” unless broader access is truly required.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Link to={backHref} className={buttonStyles({ variant: 'secondary', size: 'md' })}>
              Back
            </Link>
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={isLoading || Boolean(errorMessage) || !validation || isContinuing}
              className={buttonStyles({ variant: 'primary', size: 'md' })}
            >
              <span className="inline-flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span>{isContinuing ? 'Redirecting...' : 'Continue to GitHub'}</span>
                {!isContinuing ? <ExternalLink className="h-4 w-4" /> : null}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
