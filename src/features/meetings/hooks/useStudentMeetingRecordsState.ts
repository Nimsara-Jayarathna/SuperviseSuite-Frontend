import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiError } from '@/types';
import { studentApi } from '@/features/student/api/studentApi';
import type { MeetingChannel, MeetingRecord, MeetingRecordUpsertPayload } from '../types';
import { toApiError, type RequestModalState } from './requestModal';
import { sortMeetingRecords } from '../lib/sortMeetingRecords';

type StudentMeetingRecordsState = {
  records: MeetingRecord[];
  channels: MeetingChannel[];
  isLoading: boolean;
  error: ApiError | null;
  hasLoaded: boolean;
  isFormOpen: boolean;
  viewingRecord: MeetingRecord | null;
  requestModal: RequestModalState;
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

const INITIAL_REQUEST_MODAL: RequestModalState = {
  isOpen: false,
  status: 'loading',
  title: '',
  message: '',
  retryAction: null,
};

export function useStudentMeetingRecordsState(
  projectId: string,
  enabled = true,
): StudentMeetingRecordsState {
  const [records, setRecords] = useState<MeetingRecord[]>([]);
  const [channels, setChannels] = useState<MeetingChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MeetingRecord | null>(null);
  const [requestModal, setRequestModal] = useState<RequestModalState>(INITIAL_REQUEST_MODAL);
  const loadInFlightRef = useRef(false);

  const closeRequestModal = useCallback(() => {
    setRequestModal((current) => ({ ...current, isOpen: false, retryAction: null }));
  }, []);

  const openLoadingModal = useCallback((title: string, message: string) => {
    setRequestModal({ isOpen: true, status: 'loading', title, message, retryAction: null });
  }, []);

  const openSuccessModal = useCallback((title: string, message: string) => {
    setRequestModal({ isOpen: true, status: 'success', title, message, retryAction: null });
  }, []);

  const openErrorModal = useCallback(
    (title: string, apiError: ApiError, retryAction: () => void) => {
      setRequestModal({
        isOpen: true,
        status: 'error',
        title,
        message: apiError.message,
        retryAction,
      });
    },
    [],
  );

  const load = useCallback(
    async (options?: {
      forceRefresh?: boolean;
    }): Promise<{ ok: true } | { ok: false; error: ApiError }> => {
      if (loadInFlightRef.current) {
        return { ok: false, error: toApiError(null, 'Unable to load meeting records right now.') };
      }
      loadInFlightRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const [loadedRecords, loadedChannels] = await Promise.all([
          studentApi.getProjectMeetingRecords(projectId, options?.forceRefresh ?? false),
          studentApi.getProjectMeetingChannels(projectId, options?.forceRefresh ?? false),
        ]);
        setRecords(sortMeetingRecords(loadedRecords));
        setChannels(loadedChannels);
        setHasLoaded(true);
        return { ok: true };
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to load meeting records right now.');
        setRecords([]);
        setChannels([]);
        setError(apiError);
        return { ok: false, error: apiError };
      } finally {
        loadInFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [projectId],
  );

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
    setRecords([]);
    setChannels([]);
    setIsLoading(false);
    setHasLoaded(false);
    setError(null);
    setIsFormOpen(false);
    setViewingRecord(null);
    setRequestModal(INITIAL_REQUEST_MODAL);
    loadInFlightRef.current = false;
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
        const created = await studentApi.createProjectMeetingRecord(projectId, payload);
        setRecords((current) =>
          sortMeetingRecords([created, ...current.filter((item) => item.id !== created.id)]),
        );
        openSuccessModal('Meeting record submitted', 'Meeting record was submitted for approval.');
        closeForm();
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to submit meeting record right now.');
        openErrorModal('Unable to submit meeting record', apiError, () => void submitForm(payload));
      }
    },
    [closeForm, openErrorModal, openLoadingModal, openSuccessModal, projectId],
  );

  const openView = useCallback((record: MeetingRecord) => {
    setViewingRecord(record);
  }, []);

  const closeView = useCallback(() => {
    setViewingRecord(null);
  }, []);

  const canLoad = useMemo(
    () => enabled && !hasLoaded && !isLoading,
    [enabled, hasLoaded, isLoading],
  );

  useEffect(() => {
    if (canLoad) {
      void load();
    }
  }, [canLoad, load]);

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
