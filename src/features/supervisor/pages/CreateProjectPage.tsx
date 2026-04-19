import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { ProjectStepper } from '../components/ProjectStepper';
import { BasicsStepSection } from '../components/ProjectCreate/BasicsStepSection';
import { CreateProjectSuccessPanel } from '../components/ProjectCreate/CreateProjectSuccessPanel';
import { MilestonesStepSection } from '../components/ProjectCreate/MilestonesStepSection';
import { StudentsStepSection } from '../components/ProjectCreate/StudentsStepSection';
import { CREATE_PROJECT_STEPS } from '../createProject.shared';
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

      <ProjectStepper
        currentStep={state.currentStep}
        steps={CREATE_PROJECT_STEPS}
        onStepClick={(step) => {
          if (step < state.currentStep) state.goStep(step as 1 | 2 | 3);
        }}
      />

      <form onSubmit={state.handleSubmit}>
        {state.currentStep === 1 && (
          <BasicsStepSection
            draft={state.draft}
            step1Valid={state.step1Valid}
            isSubmitting={state.isSubmitting}
            onUpdateDraft={state.updateDraft}
            onNext={() => state.goStep(2)}
          />
        )}

        {state.currentStep === 2 && (
          <StudentsStepSection
            studentQuery={state.studentQuery}
            searchState={state.searchState}
            searchError={state.searchError}
            searchResults={state.searchResults}
            selectedStudents={state.selectedStudents}
            selectedLeaderId={state.selectedLeaderId}
            shouldShowSearchPanel={state.shouldShowSearchPanel}
            isSubmitting={state.isSubmitting}
            step2Valid={state.step2Valid}
            buildStudentLabel={state.buildStudentLabel}
            onSetStudentQuery={state.setStudentQuery}
            onSelectStudent={state.selectStudent}
            onRemoveStudent={state.removeStudent}
            onSetLeaderId={state.setSelectedLeaderId}
            onBack={() => state.goStep(1)}
            onNext={() => state.goStep(3)}
          />
        )}

        {state.currentStep === 3 && (
          <MilestonesStepSection
            milestones={state.milestones}
            expandedMilestoneIndex={state.expandedMilestoneIndex}
            milestoneRefs={state.milestoneRefs}
            isSubmitting={state.isSubmitting}
            submitError={state.submitError}
            showIncompleteHint={state.showIncompleteHint}
            step3Valid={state.step3Valid}
            milestonePolicyError={state.milestonePolicyError}
            incompleteMilestoneCount={state.incompleteMilestoneCount}
            onUpdateMilestone={state.updateMilestone}
            onToggleMilestone={state.toggleMilestone}
            onRemoveMilestone={state.removeMilestone}
            onAddMilestone={state.addMilestone}
            onBack={() => state.goStep(2)}
            onShowIncompleteHint={() => {
              if (!state.step3Valid) state.setShowIncompleteHint(true);
            }}
          />
        )}
      </form>

      {state.createdProject && (
        <CreateProjectSuccessPanel
          createdProject={state.createdProject}
          primaryMilestone={state.primaryCreatedMilestone}
        />
      )}
    </div>
  );
}
