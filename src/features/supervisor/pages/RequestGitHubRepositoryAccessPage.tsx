import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { getBlockingErrorTitle, isBlockingError } from '@/utils/errorSeverity';
import { ExternalLink, FolderGit2, Github, ShieldCheck } from 'lucide-react';
import { supervisorApi } from '../api/supervisorApi';
import { RequestStateModal } from '@/components/ui/RequestStateModal';

const INVALID_LINK_MESSAGE =
  'This access request link is invalid or has expired. Please create a new access request from the project.';

function isValidGitHubAuthorizeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return host === 'github.com' || host.endsWith('.github.com');
  } catch {
    return false;
  }
}

export function RequestGitHubRepositoryAccessPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams]);

  const [isContinuing, setIsContinuing] = useState(false);
  const [error, setError] = useState<ApiError | null>(
    token
      ? null
      : {
          code: 'BAD_REQUEST',
          message: INVALID_LINK_MESSAGE,
          details: [],
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          path: '/github/request-access',
          traceId: null,
        },
  );

  const errorMessage = error?.message ?? null;

  async function handleContinue() {
    if (!token) {
      setError({
        code: 'BAD_REQUEST',
        message: INVALID_LINK_MESSAGE,
        details: [],
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'Bad Request',
        path: '/github/request-access',
        traceId: null,
      });
      return;
    }

    setIsContinuing(true);
    setError(null);

    try {
      const data = await supervisorApi.startGitHubAccessSourceInstall({ requestToken: token });
      if (!data.githubAuthorizeUrl?.trim()) {
        setError({
          code: 'SERVICE_UNAVAILABLE',
          message: 'GitHub authorization URL could not be prepared. Please try again.',
          details: [],
          timestamp: new Date().toISOString(),
          status: 503,
          error: 'Service Unavailable',
          path: '/github/request-access',
          traceId: null,
        });
        return;
      }
      if (!isValidGitHubAuthorizeUrl(data.githubAuthorizeUrl)) {
        setError({
          code: 'BAD_REQUEST',
          message: 'GitHub authorization URL is invalid. Please try again.',
          details: [],
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          path: '/github/request-access',
          traceId: null,
        });
        return;
      }
      window.location.assign(data.githubAuthorizeUrl);
    } catch (error) {
      if (isApiException(error)) {
        setError(error.apiError);
      } else {
        setError({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Unable to continue to GitHub right now. Please try again.',
          details: [],
          timestamp: new Date().toISOString(),
          status: 503,
          error: 'Service Unavailable',
          path: '/github/request-access',
          traceId: null,
        });
      }
    } finally {
      setIsContinuing(false);
    }
  }

  const showBlockingState = error ? isBlockingError(error) : false;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50 to-transparent" />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Access Request
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Request Repository Access
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Continue to GitHub as the repository owner and install/select repositories for this
            project. After installation, you will be redirected back to project repository
            selection.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <FolderGit2 className="h-4 w-4" />
                Step 1
              </div>
              <p className="mt-2 text-sm text-slate-700">Continue to GitHub authorization.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                Step 2
              </div>
              <p className="mt-2 text-sm text-slate-700">Install app and select repositories.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Github className="h-4 w-4" />
                Step 3
              </div>
              <p className="mt-2 text-sm text-slate-700">
                Return to SuperviseSuite and link repos.
              </p>
            </div>
          </div>

          {errorMessage && !showBlockingState ? (
            <div className="mt-7 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-semibold text-rose-700">Unable to continue</p>
              <p className="mt-1 text-sm text-rose-700">{errorMessage}</p>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Link to="/" className={buttonStyles({ variant: 'secondary', size: 'md' })}>
              Back
            </Link>
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={Boolean(errorMessage) || isContinuing}
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

      <RequestStateModal
        isOpen={showBlockingState}
        status="error"
        title={getBlockingErrorTitle(error)}
        message={error?.message ?? 'Unable to continue right now.'}
        onClose={() => setError(null)}
      />
    </div>
  );
}
