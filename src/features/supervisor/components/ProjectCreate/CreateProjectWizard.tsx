import { ProjectStepper } from '../ProjectStepper';
import { BasicsStepSection } from './BasicsStepSection';
import { CreateProjectSuccessPanel } from './CreateProjectSuccessPanel';
import { MilestonesStepSection } from './MilestonesStepSection';
import { StudentsStepSection } from './StudentsStepSection';
import { CREATE_PROJECT_STEPS } from '../../createProject.shared';
import type { CreateProjectStepId } from '../../createProject.shared';
import type { useCreateProjectPageState } from '../../hooks/useCreateProjectPageState';

type CreateProjectWizardProps = {
  state: ReturnType<typeof useCreateProjectPageState>;
};

export function CreateProjectWizard({ state }: CreateProjectWizardProps) {
  return (
    <>
      <ProjectStepper
        currentStep={state.currentStep}
        steps={CREATE_PROJECT_STEPS}
        onStepClick={(step) => {
          if (step < state.currentStep) state.goStep(step as CreateProjectStepId);
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
    </>
  );
}
