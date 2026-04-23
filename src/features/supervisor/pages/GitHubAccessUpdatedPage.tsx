import { buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { GitHubAccessUpdatedSuccessContent } from '../components/GitHubAccessUpdated/GitHubAccessUpdatedSuccessContent';
import { useGitHubAccessUpdatedPageState } from '../hooks/useGitHubAccessUpdatedPageState';

export function GitHubAccessUpdatedPage() {
  const state = useGitHubAccessUpdatedPageState();

  return (
    <div className="min-h-[50vh]">
      <RequestStateModal
        isOpen
        status={state.status}
        title={state.title}
        message={state.message}
        autoCloseOnSuccess={false}
        onClose={state.onClose}
        onRetry={state.onRetry}
        content={
          state.status === 'success' && state.summary ? (
            <GitHubAccessUpdatedSuccessContent
              summary={state.summary}
              scopeLabel={state.scopeLabel}
            />
          ) : undefined
        }
        footer={
          state.status === 'success' ? (
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className={buttonStyles({ variant: 'primary', size: 'md' })}
                onClick={() => void state.handleConfirmAndContinue()}
                disabled={state.isAcknowledging}
              >
                {state.isAcknowledging ? 'Opening repository selection...' : 'Review repositories'}
              </button>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
