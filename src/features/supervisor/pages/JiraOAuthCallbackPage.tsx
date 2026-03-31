import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const next = new URLSearchParams();
    if (code) {
      next.set('jiraCode', code);
    }
    if (state) {
      next.set('jiraState', state);
    }
    if (error) {
      next.set('jiraError', error);
    }
    if (errorDescription) {
      next.set('jiraErrorDescription', errorDescription);
    }
    const safeProjectId = encodeURIComponent(stateProjectId);
    window.location.replace(`/supervisor/projects/${safeProjectId}?${next.toString()}`);
  }, [searchParams]);

  return null;
}
