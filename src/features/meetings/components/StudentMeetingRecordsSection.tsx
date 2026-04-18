import { ErrorState } from '@/components/feedback/ErrorState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { RefreshCw, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { MeetingRecordsTable } from './MeetingRecordsTable';
import { MeetingRecordFormModal } from './MeetingRecordFormModal';
import { MeetingRecordDetailsModal } from './MeetingRecordDetailsModal';
import { useStudentMeetingRecordsState } from '../hooks/useStudentMeetingRecordsState';

type StudentMeetingRecordsSectionProps = {
  projectId: string;
  enabled?: boolean;
};

export function StudentMeetingRecordsSection({
  projectId,
  enabled = true,
}: StudentMeetingRecordsSectionProps) {
  const state = useStudentMeetingRecordsState(projectId, enabled);

  const channelsById = useMemo(() => {
    return Object.fromEntries(state.channels.map((channel) => [channel.id, channel]));
  }, [state.channels]);

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Meeting Records</h2>
          <p className="text-xs font-medium text-slate-400">
            Log meetings quickly and request supervisor approval when needed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={() => void state.refresh()}
            disabled={state.isLoading}
            title="Refresh records"
            aria-label="Refresh records"
          >
            <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={state.openAdd}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add record
          </Button>
        </div>
      </div>

      <div className="mt-6">
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
      </div>

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
    </section>
  );
}
