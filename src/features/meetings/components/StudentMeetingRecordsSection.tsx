import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { RefreshCw, Plus } from 'lucide-react';
import { useChannelsById } from '../hooks/shared/useChannelsById';
import { MeetingRecordsTable } from './MeetingRecordsTable';
import { MeetingRecordFormModal } from './MeetingRecordFormModal';
import { MeetingRecordDetailsModal } from './MeetingRecordDetailsModal';
import { useStudentMeetingRecordsState } from '../hooks/useStudentMeetingRecordsState';
import { SectionCard } from '@/components/ui/SectionCard';
import { IconActionButton } from '@/components/ui/IconActionButton';

type StudentMeetingRecordsSectionProps = {
  projectId: string;
  enabled?: boolean;
};

export function StudentMeetingRecordsSection({
  projectId,
  enabled = true,
}: StudentMeetingRecordsSectionProps) {
  const state = useStudentMeetingRecordsState(projectId, enabled);
  const channelsById = useChannelsById(state.channels);

  return (
    <>
      <SectionCard
        title="Meeting Records"
        subtitle="Log meetings quickly and request supervisor approval when needed."
        actions={
          <>
            <IconActionButton
              label="Refresh records"
              title="Refresh records"
              onClick={() => void state.refresh()}
              disabled={state.isLoading}
              icon={<RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={state.openAdd}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add record
            </Button>
          </>
        }
      >
        {state.isLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Loading records...
          </div>
        ) : null}

        {state.error ? <ErrorState error={state.error} onRetry={() => void state.load()} /> : null}

        {!state.isLoading && !state.error ? (
          <MeetingRecordsTable
            records={state.records}
            channelsById={channelsById}
            canManage={false}
            onView={(record) => state.openView(record)}
          />
        ) : null}
      </SectionCard>

      <MeetingRecordFormModal
        isOpen={state.isFormOpen}
        mode="add"
        initialRecord={null}
        channels={state.channels}
        onClose={state.closeForm}
        onSubmit={(payload) => void state.submitForm(payload)}
      />

      <MeetingRecordDetailsModal
        isOpen={Boolean(state.viewingRecord)}
        record={state.viewingRecord}
        channelsById={channelsById}
        onClose={state.closeView}
      />

      <RequestStateModal
        isOpen={state.requestModal.isOpen}
        status={state.requestModal.status}
        title={state.requestModal.title}
        message={state.requestModal.message}
        onClose={state.requestModal.status === 'loading' ? undefined : state.closeRequestModal}
        onRetry={
          state.requestModal.status === 'error'
            ? (state.requestModal.retryAction ?? undefined)
            : undefined
        }
      />
    </>
  );
}
