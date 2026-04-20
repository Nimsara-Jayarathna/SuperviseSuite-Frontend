import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { CreateProjectWizard } from '../components/ProjectCreate/CreateProjectWizard';
import { useCreateProjectPageState } from '../hooks/useCreateProjectPageState';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const state = useCreateProjectPageState({
    onSuccessNavigate: () => navigate('/supervisor/projects'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Project"
        subtitle="Fill in each step to set up a new project with students and milestones."
      />

      <RequestStateModal
        isOpen={state.requestModal.isOpen}
        status={state.requestModal.status}
        title={state.requestModal.title}
        message={state.requestModal.message}
        onClose={state.requestModal.status === 'loading' ? undefined : state.closeRequestModal}
        onRetry={state.requestModal.status === 'error' ? state.closeRequestModal : undefined}
      />

      <CreateProjectWizard state={state} />
    </div>
  );
}
