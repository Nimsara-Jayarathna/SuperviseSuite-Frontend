import { useMemo } from 'react';
import { ProjectOverviewContent } from '@/features/projects/components/ProjectOverviewContent';
import { useMeetingAnalytics } from '@/features/projects/hooks/useMeetingAnalytics';
import { supervisorApi } from '../../api/supervisorApi';
import type { OverviewState } from '../../hooks/useProjectDetailsPageState';
import { FIELD_LIMITS, LIFECYCLE_OPTIONS } from '../../projectDetails.shared';
import type { SupervisorProjectLifecycle, SupervisorProjectDetail } from '../../types';

type OverviewTabSectionProps = {
  project: SupervisorProjectDetail;
  overview: OverviewState;
};

export function OverviewTabSection({ project, overview }: OverviewTabSectionProps) {
  const meetingFetchers = useMemo(
    () => ({
      getMeetingChannels: supervisorApi.getProjectMeetingChannels,
      getMeetingRecords: supervisorApi.getProjectMeetingRecords,
    }),
    [],
  );
  const meetingAnalytics = useMeetingAnalytics(project.id, meetingFetchers);

  return (
    <ProjectOverviewContent
      project={project}
      role="supervisor"
      meetingAnalytics={meetingAnalytics}
      edit={{
        isEditing: overview.isEditingOverview,
        isSaving: overview.isSavingOverview,
        isDirty: overview.isOverviewDirty,
        form: overview.overviewForm,
        lifecycleOptions: LIFECYCLE_OPTIONS,
        fieldLimits: FIELD_LIMITS,
        onStartEdit: overview.startEdit,
        onCancelEdit: overview.cancelEdit,
        onSubmit: overview.submit,
        onChangeField: overview.setField,
        onLifecycleChange: (value) =>
          overview.setField('lifecycleStatus', value as SupervisorProjectLifecycle),
      }}
    />
  );
}
