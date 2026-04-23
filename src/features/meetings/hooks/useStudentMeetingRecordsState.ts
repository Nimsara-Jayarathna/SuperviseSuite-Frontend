import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from '@/types';
import { studentApi } from '@/features/student/api/studentApi';
import type { MeetingChannel, MeetingRecord, MeetingRecordUpsertPayload } from '../types';
import { toApiError } from './requestModal';
import { useRequestModalControls } from './useRequestModalControls';
import { useMeetingRecordsData } from './shared/useMeetingRecordsData';

type StudentMeetingRecordsState = {
  records: MeetingRecord[];
  channels: MeetingChannel[];
  isLoading: boolean;
  error: ApiError | null;
  hasLoaded: boolean;
  isFormOpen: boolean;
  viewingRecord: MeetingRecord | null;
  requestModal: ReturnType<typeof useRequestModalControls>['requestModal'];
  load: (options?: {
    forceRefresh?: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: ApiError }>;
  refresh: () => Promise<void>;
  openAdd: () => void;
  closeForm: () => void;
  submitForm: (payload: MeetingRecordUpsertPayload) => Promise<void>;
  openView: (record: MeetingRecord) => void;
  closeView: () => void;
  closeRequestModal: () => void;
};

export function useStudentMeetingRecordsState(
  projectId: string,
  enabled = true,
): StudentMeetingRecordsState {
  const { records, channels, isLoading, error, hasLoaded, load, createRecord } =
    useMeetingRecordsData({ projectId, enabled, api: studentApi });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MeetingRecord | null>(null);
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
    setIsFormOpen(false);
    setViewingRecord(null);
  }, [projectId]);

  const openAdd = useCallback(() => {
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
  }, []);

  const submitForm = useCallback(
    async (payload: MeetingRecordUpsertPayload) => {
      openLoadingModal('Submitting meeting record', 'Submitting meeting record for this project.');

      try {
        await createRecord(payload);
        openSuccessModal('Meeting record submitted', 'Meeting record was submitted for approval.');
        closeForm();
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to submit meeting record right now.');
        openErrorModal('Unable to submit meeting record', apiError, () => void submitForm(payload));
      }
    },
    [closeForm, createRecord, openErrorModal, openLoadingModal, openSuccessModal],
  );

  const openView = useCallback((record: MeetingRecord) => {
    setViewingRecord(record);
  }, []);

  const closeView = useCallback(() => {
    setViewingRecord(null);
  }, []);

  return {
    records,
    channels,
    isLoading,
    error,
    hasLoaded,
    isFormOpen,
    viewingRecord,
    requestModal,
    load,
    refresh,
    openAdd,
    closeForm,
    submitForm,
    openView,
    closeView,
    closeRequestModal,
  };
}
