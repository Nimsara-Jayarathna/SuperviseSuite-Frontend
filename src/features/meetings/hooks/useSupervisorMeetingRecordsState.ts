import { useCallback, useEffect } from 'react';
import type { ApiError } from '@/types';
import { supervisorApi } from '@/features/supervisor/api/supervisorApi';
import type { MeetingChannel, MeetingRecord, MeetingRecordUpsertPayload } from '../types';
import { toApiError } from './requestModal';
import { useRequestModalControls } from './useRequestModalControls';
import { useMeetingRecordsData } from './shared/useMeetingRecordsData';
import { useMeetingRecordFormState } from './supervisor/useMeetingRecordFormState';
import { useMeetingRecordOverlayState } from './supervisor/useMeetingRecordOverlayState';

type SupervisorMeetingRecordsState = {
  records: MeetingRecord[];
  channels: MeetingChannel[];
  isLoading: boolean;
  error: ApiError | null;
  hasLoaded: boolean;
  isFormOpen: boolean;
  formMode: 'add' | 'edit';
  editingRecord: MeetingRecord | null;
  viewingRecord: MeetingRecord | null;
  pendingDelete: MeetingRecord | null;
  requestModal: ReturnType<typeof useRequestModalControls>['requestModal'];
  load: (options?: {
    forceRefresh?: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: ApiError }>;
  refresh: () => Promise<void>;
  openAdd: () => void;
  openEdit: (record: MeetingRecord) => void;
  closeForm: () => void;
  submitForm: (payload: MeetingRecordUpsertPayload) => Promise<void>;
  openDelete: (record: MeetingRecord) => void;
  closeDelete: () => void;
  confirmDelete: () => Promise<void>;
  approve: (record: MeetingRecord) => Promise<void>;
  openView: (record: MeetingRecord) => void;
  closeView: () => void;
  closeRequestModal: () => void;
};

export function useSupervisorMeetingRecordsState(
  projectId: string,
  enabled = true,
): SupervisorMeetingRecordsState {
  const {
    records,
    channels,
    isLoading,
    error,
    hasLoaded,
    load,
    createRecord,
    updateRecord,
    deleteRecord,
    approveRecord,
  } = useMeetingRecordsData({ projectId, enabled, api: supervisorApi });
  const { isFormOpen, formMode, editingRecord, openAdd, openEdit, closeForm } =
    useMeetingRecordFormState();
  const { viewingRecord, pendingDelete, openView, closeView, openDelete, closeDelete } =
    useMeetingRecordOverlayState();

  const { requestModal, closeRequestModal, openLoadingModal, openSuccessModal, openErrorModal } =
    useRequestModalControls();

  const refresh = useCallback(async () => {
    openLoadingModal(
      'Refreshing meeting records',
      'Fetching the latest meeting records for this project.',
    );
    const result = await load({ forceRefresh: true });
    if (result.ok) {
      openSuccessModal('Meeting records refreshed', 'You are viewing the latest meeting records.');
      return;
    }

    openErrorModal('Unable to refresh meeting records', result.error, () => void refresh());
  }, [load, openErrorModal, openLoadingModal, openSuccessModal]);

  useEffect(() => {
    closeForm();
    closeView();
    closeDelete();
  }, [closeDelete, closeForm, closeView, projectId]);

  const submitForm = useCallback(
    async (payload: MeetingRecordUpsertPayload) => {
      if (formMode === 'edit' && !editingRecord) {
        openErrorModal(
          'Unable to save record',
          toApiError(null, 'Select a valid record and try again.'),
          () => void submitForm(payload),
        );
        return;
      }

      openLoadingModal(
        formMode === 'add' ? 'Adding meeting record' : 'Saving meeting record',
        formMode === 'add'
          ? 'Submitting meeting record for this project.'
          : 'Updating meeting record details.',
      );

      try {
        if (formMode === 'add') {
          await createRecord(payload);
          openSuccessModal('Meeting record added', 'Meeting record was added successfully.');
        } else {
          await updateRecord(editingRecord!.id, payload);
          openSuccessModal('Meeting record updated', 'Meeting record was updated successfully.');
        }
        closeForm();
      } catch (caught) {
        const apiError = toApiError(
          caught,
          formMode === 'add'
            ? 'Unable to add meeting record right now.'
            : 'Unable to update meeting record right now.',
        );
        openErrorModal(
          formMode === 'add' ? 'Unable to add meeting record' : 'Unable to update meeting record',
          apiError,
          () => void submitForm(payload),
        );
      }
    },
    [
      closeForm,
      editingRecord,
      formMode,
      openErrorModal,
      openLoadingModal,
      openSuccessModal,
      createRecord,
      updateRecord,
    ],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    const recordId = pendingDelete.id;
    openLoadingModal('Deleting meeting record', 'Removing meeting record from this project.');
    try {
      await deleteRecord(recordId);
      closeDelete();
      openSuccessModal('Meeting record deleted', 'Meeting record was removed successfully.');
    } catch (caught) {
      const apiError = toApiError(caught, 'Unable to delete meeting record right now.');
      openErrorModal('Unable to delete meeting record', apiError, () => void confirmDelete());
    }
  }, [
    closeDelete,
    deleteRecord,
    openErrorModal,
    openLoadingModal,
    openSuccessModal,
    pendingDelete,
  ]);

  const approve = useCallback(
    async (record: MeetingRecord) => {
      openLoadingModal('Approving meeting record', 'Approving the selected meeting record.');
      try {
        await approveRecord(record.id);
        openSuccessModal('Meeting record approved', 'Meeting record was approved successfully.');
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to approve meeting record right now.');
        openErrorModal('Unable to approve meeting record', apiError, () => void approve(record));
      }
    },
    [approveRecord, openErrorModal, openLoadingModal, openSuccessModal],
  );

  return {
    records,
    channels,
    isLoading,
    error,
    hasLoaded,
    isFormOpen,
    formMode,
    editingRecord,
    viewingRecord,
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
    openView,
    closeView,
    closeRequestModal,
  };
}
