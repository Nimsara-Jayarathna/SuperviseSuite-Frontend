import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JIRA_RESULT_KEY_PREFIX = 'jira-oauth:';

export function JiraOAuthCallbackPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const stateProjectId = state?.split(':').pop();
    if (!stateProjectId || !UUID_PATTERN.test(stateProjectId)) {
      window.location.replace('/supervisor/projects');
      return;
    }
    const safeProjectId = encodeURIComponent(stateProjectId);
    try {
      const resultKey = `${JIRA_RESULT_KEY_PREFIX}${Date.now()}:${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(
        resultKey,
        JSON.stringify({
          code: code ?? null,
          state: state ?? null,
          error: error ?? null,
          errorDescription: errorDescription ?? null,
        }),
      );
      window.location.replace(
        `/supervisor/projects/${safeProjectId}?jiraResultKey=${encodeURIComponent(resultKey)}`,
      );
    } catch {
      window.location.replace(
        `/supervisor/projects/${safeProjectId}?jiraError=${encodeURIComponent(
          'Unable to finalize Jira connection. Please try again.',
        )}`,
      );
    }
  }, [searchParams]);

  return null;
}
