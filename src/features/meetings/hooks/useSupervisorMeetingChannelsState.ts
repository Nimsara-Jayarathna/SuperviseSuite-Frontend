import { useCallback, useEffect } from 'react';
import type { ApiError } from '@/types';
import { supervisorApi } from '@/features/supervisor/api/supervisorApi';
import type { MeetingChannel, MeetingChannelUpsertPayload } from '../types';
import { toApiError } from './requestModal';
import { useRequestModalControls } from './useRequestModalControls';
import { useMeetingChannelsData } from './shared/useMeetingChannelsData';
import { useCopyToClipboard } from './shared/useCopyToClipboard';
import { useMeetingChannelFormState } from './supervisor/useMeetingChannelFormState';

type SupervisorMeetingChannelsState = {
  channels: MeetingChannel[];
  isLoading: boolean;
  error: ApiError | null;
  hasLoaded: boolean;
  isFormOpen: boolean;
  formMode: 'add' | 'edit';
  editingChannel: MeetingChannel | null;
  pendingDelete: MeetingChannel | null;
  requestModal: ReturnType<typeof useRequestModalControls>['requestModal'];
  load: (options?: {
    forceRefresh?: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: ApiError }>;
  refresh: () => Promise<void>;
  openAdd: () => void;
  openEdit: (channel: MeetingChannel) => void;
  closeForm: () => void;
  submitForm: (payload: MeetingChannelUpsertPayload) => Promise<void>;
  openDelete: (channel: MeetingChannel) => void;
  closeDelete: () => void;
  confirmDelete: () => Promise<void>;
  approve: (channel: MeetingChannel) => Promise<void>;
  copyToClipboard: (value: string) => Promise<boolean>;
  closeRequestModal: () => void;
};

export function useSupervisorMeetingChannelsState(
  projectId: string,
  enabled = true,
): SupervisorMeetingChannelsState {
  const {
    channels,
    isLoading,
    error,
    hasLoaded,
    load,
    createChannel,
    updateChannel,
    deleteChannel,
    approveChannel,
  } = useMeetingChannelsData({ projectId, enabled, api: supervisorApi });
  const {
    isFormOpen,
    formMode,
    editingChannel,
    pendingDelete,
    openAdd,
    openEdit,
    closeForm,
    openDelete,
    closeDelete,
  } = useMeetingChannelFormState();

  const { requestModal, closeRequestModal, openLoadingModal, openSuccessModal, openErrorModal } =
    useRequestModalControls();

  const refresh = useCallback(async () => {
    openLoadingModal(
      'Refreshing meeting channels',
      'Fetching the latest meeting channels for this project.',
    );
    const result = await load({ forceRefresh: true });
    if (result.ok) {
      openSuccessModal(
        'Meeting channels refreshed',
        'You are viewing the latest meeting channels.',
      );
      return;
    }

    openErrorModal('Unable to refresh meeting channels', result.error, () => void refresh());
  }, [load, openErrorModal, openLoadingModal, openSuccessModal]);

  useEffect(() => {
    closeForm();
    closeDelete();
  }, [closeDelete, closeForm, projectId]);

  const submitForm = useCallback(
    async (payload: MeetingChannelUpsertPayload) => {
      if (formMode === 'edit' && !editingChannel) {
        openErrorModal(
          'Unable to save channel',
          toApiError(null, 'Select a valid channel and try again.'),
          () => void submitForm(payload),
        );
        return;
      }

      openLoadingModal(
        formMode === 'add' ? 'Adding meeting channel' : 'Saving meeting channel',
        formMode === 'add'
          ? 'Submitting meeting channel for this project.'
          : 'Updating meeting channel details.',
      );

      try {
        if (formMode === 'add') {
          await createChannel(payload);
          openSuccessModal('Meeting channel added', 'Meeting channel was added successfully.');
        } else {
          await updateChannel(editingChannel!.id, payload);
          openSuccessModal('Meeting channel updated', 'Meeting channel was updated successfully.');
        }
        closeForm();
      } catch (caught) {
        const apiError = toApiError(
          caught,
          formMode === 'add'
            ? 'Unable to add meeting channel right now.'
            : 'Unable to update meeting channel right now.',
        );
        openErrorModal(
          formMode === 'add' ? 'Unable to add meeting channel' : 'Unable to update meeting channel',
          apiError,
          () => void submitForm(payload),
        );
      }
    },
    [
      closeForm,
      editingChannel,
      formMode,
      openErrorModal,
      openLoadingModal,
      openSuccessModal,
      createChannel,
      updateChannel,
    ],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    const channelId = pendingDelete.id;
    openLoadingModal('Deleting meeting channel', 'Removing meeting channel from this project.');
    try {
      await deleteChannel(channelId);
      closeDelete();
      openSuccessModal('Meeting channel deleted', 'Meeting channel was removed successfully.');
    } catch (caught) {
      const apiError = toApiError(caught, 'Unable to delete meeting channel right now.');
      openErrorModal('Unable to delete meeting channel', apiError, () => void confirmDelete());
    }
  }, [
    closeDelete,
    deleteChannel,
    openErrorModal,
    openLoadingModal,
    openSuccessModal,
    pendingDelete,
  ]);

  const approve = useCallback(
    async (channel: MeetingChannel) => {
      openLoadingModal('Approving meeting channel', 'Approving the selected meeting channel.');
      try {
        await approveChannel(channel.id);
        openSuccessModal('Meeting channel approved', 'Meeting channel was approved successfully.');
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to approve meeting channel right now.');
        openErrorModal('Unable to approve meeting channel', apiError, () => void approve(channel));
      }
    },
    [approveChannel, openErrorModal, openLoadingModal, openSuccessModal],
  );

  const copyToClipboard = useCopyToClipboard(
    useCallback(
      (retryAction) => {
        openErrorModal(
          'Copy failed',
          toApiError(null, 'Unable to copy value automatically.'),
          retryAction,
        );
      },
      [openErrorModal],
    ),
  );

  return {
    channels,
    isLoading,
    error,
    hasLoaded,
    isFormOpen,
    formMode,
    editingChannel,
    pendingDelete,
    requestModal,
    load,
    refresh,
    openAdd,
    openEdit,
    closeForm,
    submitForm,
    openDelete,
    closeDelete,
    confirmDelete,
    approve,
    copyToClipboard,
    closeRequestModal,
  };
}
