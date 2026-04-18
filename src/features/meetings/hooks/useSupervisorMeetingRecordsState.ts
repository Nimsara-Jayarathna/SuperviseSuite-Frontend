import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiError } from '@/types';
import { supervisorApi } from '@/features/supervisor/api/supervisorApi';
import type { MeetingChannel, MeetingRecord, MeetingRecordUpsertPayload } from '../types';
import { toApiError, type RequestModalState } from './requestModal';
import { sortMeetingRecords } from '../lib/sortMeetingRecords';

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
  requestModal: RequestModalState;
  load: (options?: { forceRefresh?: boolean }) => Promise<{ ok: true } | { ok: false; error: ApiError }>;
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

const INITIAL_REQUEST_MODAL: RequestModalState = {
  isOpen: false,
  status: 'loading',
  title: '',
  message: '',
  retryAction: null,
};

export function useSupervisorMeetingRecordsState(
  projectId: string,
  enabled = true,
): SupervisorMeetingRecordsState {
  const [records, setRecords] = useState<MeetingRecord[]>([]);
  const [channels, setChannels] = useState<MeetingChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingRecord, setEditingRecord] = useState<MeetingRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MeetingRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MeetingRecord | null>(null);
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
          supervisorApi.getProjectMeetingRecords(projectId, options?.forceRefresh ?? false),
          supervisorApi.getProjectMeetingChannels(projectId, options?.forceRefresh ?? false),
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
    openLoadingModal('Refreshing meeting records', 'Fetching the latest meeting records for this project.');
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
    setFormMode('add');
    setEditingRecord(null);
    setViewingRecord(null);
    setPendingDelete(null);
    setRequestModal(INITIAL_REQUEST_MODAL);
    loadInFlightRef.current = false;
  }, [projectId]);

  const openAdd = useCallback(() => {
    setFormMode('add');
    setEditingRecord(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((record: MeetingRecord) => {
    setFormMode('edit');
    setEditingRecord(record);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingRecord(null);
    setFormMode('add');
  }, []);

  const submitForm = useCallback(
    async (payload: MeetingRecordUpsertPayload) => {
      if (formMode === 'edit' && !editingRecord) {
        openErrorModal('Unable to save record', toApiError(null, 'Select a valid record and try again.'), () =>
          void submitForm(payload),
        );
        return;
      }

      openLoadingModal(
        formMode === 'add' ? 'Adding meeting record' : 'Saving meeting record',
        formMode === 'add' ? 'Submitting meeting record for this project.' : 'Updating meeting record details.',
      );

      try {
        if (formMode === 'add') {
          const created = await supervisorApi.createProjectMeetingRecord(projectId, payload);
          setRecords((current) =>
            sortMeetingRecords([created, ...current.filter((item) => item.id !== created.id)]),
          );
          openSuccessModal('Meeting record added', 'Meeting record was added successfully.');
        } else {
          const updated = await supervisorApi.updateProjectMeetingRecord(projectId, editingRecord!.id, payload);
          setRecords((current) =>
            sortMeetingRecords(current.map((item) => (item.id === updated.id ? updated : item))),
          );
          openSuccessModal('Meeting record updated', 'Meeting record was updated successfully.');
        }
        closeForm();
      } catch (caught) {
        const apiError = toApiError(
          caught,
          formMode === 'add' ? 'Unable to add meeting record right now.' : 'Unable to update meeting record right now.',
        );
        openErrorModal(
          formMode === 'add' ? 'Unable to add meeting record' : 'Unable to update meeting record',
          apiError,
          () => void submitForm(payload),
        );
      }
    },
    [closeForm, editingRecord, formMode, openErrorModal, openLoadingModal, openSuccessModal, projectId],
  );

  const openDelete = useCallback((record: MeetingRecord) => {
    setPendingDelete(record);
  }, []);

  const closeDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    const recordId = pendingDelete.id;
    openLoadingModal('Deleting meeting record', 'Removing meeting record from this project.');
    try {
      await supervisorApi.deleteProjectMeetingRecord(projectId, recordId);
      setRecords((current) => current.filter((item) => item.id !== recordId));
      closeDelete();
      openSuccessModal('Meeting record deleted', 'Meeting record was removed successfully.');
    } catch (caught) {
      const apiError = toApiError(caught, 'Unable to delete meeting record right now.');
      openErrorModal('Unable to delete meeting record', apiError, () => void confirmDelete());
    }
  }, [closeDelete, openErrorModal, openLoadingModal, openSuccessModal, pendingDelete, projectId]);

  const approve = useCallback(
    async (record: MeetingRecord) => {
      openLoadingModal('Approving meeting record', 'Approving the selected meeting record.');
      try {
        const approved = await supervisorApi.approveProjectMeetingRecord(projectId, record.id);
        setRecords((current) =>
          sortMeetingRecords(current.map((item) => (item.id === approved.id ? approved : item))),
        );
        openSuccessModal('Meeting record approved', 'Meeting record was approved successfully.');
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to approve meeting record right now.');
        openErrorModal('Unable to approve meeting record', apiError, () => void approve(record));
      }
    },
    [openErrorModal, openLoadingModal, openSuccessModal, projectId],
  );

  const openView = useCallback((record: MeetingRecord) => {
    setViewingRecord(record);
  }, []);

  const closeView = useCallback(() => {
    setViewingRecord(null);
  }, []);

  const canLoad = useMemo(() => enabled && !hasLoaded && !isLoading, [enabled, hasLoaded, isLoading]);

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

