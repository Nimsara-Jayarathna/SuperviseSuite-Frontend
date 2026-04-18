import { ErrorState } from '@/components/feedback/ErrorState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { RefreshCw, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { MeetingRecordDeleteConfirmModal } from './MeetingRecordDeleteConfirmModal';
import { MeetingRecordDetailsModal } from './MeetingRecordDetailsModal';
import { MeetingRecordFormModal } from './MeetingRecordFormModal';
import { MeetingRecordsTable } from './MeetingRecordsTable';
import { useSupervisorMeetingRecordsState } from '../hooks/useSupervisorMeetingRecordsState';

type SupervisorMeetingRecordsSectionProps = {
  projectId: string;
  enabled?: boolean;
};

export function SupervisorMeetingRecordsSection({
  projectId,
  enabled = true,
}: SupervisorMeetingRecordsSectionProps) {
  const state = useSupervisorMeetingRecordsState(projectId, enabled);

  const channelsById = useMemo(() => {
    return Object.fromEntries(state.channels.map((channel) => [channel.id, channel]));
  }, [state.channels]);

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Meeting Records</h2>
          <p className="text-xs font-medium text-slate-400">
            Review, approve, and maintain meeting records for this project.
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
            canManage
            onView={(record) => state.openView(record)}
            onApprove={(record) => void state.approve(record)}
            onEdit={(record) => state.openEdit(record)}
            onDelete={(record) => state.openDelete(record)}
          />
        ) : null}
      </div>

      <MeetingRecordFormModal
        isOpen={state.isFormOpen}
        mode={state.formMode}
        initialRecord={state.formMode === 'edit' ? state.editingRecord : null}
        channels={state.channels}
        onClose={state.closeForm}
        onSubmit={(payload) => void state.submitForm(payload)}
      />

      <MeetingRecordDeleteConfirmModal
        isOpen={Boolean(state.pendingDelete)}
        record={state.pendingDelete}
        onCancel={state.closeDelete}
        onConfirm={() => void state.confirmDelete()}
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

