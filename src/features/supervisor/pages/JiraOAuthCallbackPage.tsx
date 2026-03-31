import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isApiException } from '@/services/apiClient';
import { supervisorApi } from '../api/supervisorApi';

export function JiraOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Finalizing Jira connection...');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      try {
        const result = await supervisorApi.completeJiraOAuth({
          code,
          state,
          error,
          errorDescription,
        });
        if (cancelled) {
          return;
        }
        navigate(
          `/supervisor/projects/${result.projectId}?jiraSetup=success&jiraWorkspace=${encodeURIComponent(result.workspaceName)}`,
          { replace: true },
        );
      } catch (err) {
        if (cancelled) {
          return;
        }
        const detail = isApiException(err)
          ? err.apiError.message
          : 'Jira authorization could not be completed.';
        setMessage(detail);
        const stateProjectId = state?.split(':').pop();
        if (stateProjectId) {
          navigate(
            `/supervisor/projects/${stateProjectId}?jiraSetup=failed&jiraMessage=${encodeURIComponent(detail)}`,
            { replace: true },
          );
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center px-4">
      <p className="text-sm text-slate-600">{message}</p>
    </main>
  );
}
