import { ErrorState } from '@/components/feedback/ErrorState';
import { Button, buttonStyles } from '@/components/ui/Button';
import { RequestStateModal } from '@/components/ui/RequestStateModal';
import { RefreshCw, Plus } from 'lucide-react';
import { MeetingChannelDeleteConfirmModal } from './MeetingChannelDeleteConfirmModal';
import { MeetingChannelFormModal } from './MeetingChannelFormModal';
import { MeetingChannelsTable } from './MeetingChannelsTable';
import { useSupervisorMeetingChannelsState } from '../hooks/useSupervisorMeetingChannelsState';

type SupervisorMeetingChannelsSectionProps = {
  projectId: string;
  enabled?: boolean;
};

export function SupervisorMeetingChannelsSection({
  projectId,
  enabled = true,
}: SupervisorMeetingChannelsSectionProps) {
  const state = useSupervisorMeetingChannelsState(projectId, enabled);

  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800">Meeting Channels</h2>
          <p className="text-xs font-medium text-slate-400">
            Store meeting links, rooms, and group references for this project.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonStyles({ variant: 'secondary', size: 'sm' })}
            onClick={() => void state.refresh()}
            disabled={state.isLoading}
            title="Refresh channels"
            aria-label="Refresh channels"
          >
            <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Button variant="primary" size="sm" onClick={state.openAdd} leftIcon={<Plus className="h-4 w-4" />}>
            Add channel
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {state.isLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Loading channels...
          </div>
        ) : null}

        {state.error ? <ErrorState error={state.error} onRetry={() => void state.load()} /> : null}

        {!state.isLoading && !state.error ? (
          <MeetingChannelsTable
            channels={state.channels}
            canManage
            onApprove={(channel) => void state.approve(channel)}
            onEdit={(channel) => state.openEdit(channel)}
            onDelete={(channel) => state.openDelete(channel)}
            onCopy={state.copyToClipboard}
          />
        ) : null}
      </div>

      <MeetingChannelFormModal
        isOpen={state.isFormOpen}
        mode={state.formMode}
        initialChannel={state.formMode === 'edit' ? state.editingChannel : null}
        onClose={state.closeForm}
        onSubmit={(payload) => void state.submitForm(payload)}
      />

      <MeetingChannelDeleteConfirmModal
        isOpen={Boolean(state.pendingDelete)}
        channel={state.pendingDelete}
        onCancel={state.closeDelete}
        onConfirm={() => void state.confirmDelete()}
      />

      <RequestStateModal
        isOpen={state.requestModal.isOpen}
        status={state.requestModal.status}
        title={state.requestModal.title}
        message={state.requestModal.message}
        onClose={state.requestModal.status === 'loading' ? undefined : state.closeRequestModal}
        onRetry={state.requestModal.status === 'error' ? state.requestModal.retryAction ?? undefined : undefined}
      />
    </section>
  );
}
