import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function JiraOAuthCallbackPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const stateProjectId = state?.split(':').pop();
    if (!stateProjectId) {
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
    window.location.replace(`/supervisor/projects/${stateProjectId}?${next.toString()}`);
  }, [searchParams]);

  return null;
}
