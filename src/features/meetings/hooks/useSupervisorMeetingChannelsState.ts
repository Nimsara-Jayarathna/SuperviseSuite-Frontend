import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiError } from '@/types';
import { supervisorApi } from '@/features/supervisor/api/supervisorApi';
import type { MeetingChannel, MeetingChannelUpsertPayload } from '../types';
import { toApiError } from './requestModal';
import { sortMeetingChannels } from '../lib/sortMeetingChannels';
import { useRequestModalControls } from './useRequestModalControls';

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
  const [channels, setChannels] = useState<MeetingChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingChannel, setEditingChannel] = useState<MeetingChannel | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MeetingChannel | null>(null);
  const loadInFlightRef = useRef(false);

  const { requestModal, closeRequestModal, openLoadingModal, openSuccessModal, openErrorModal } =
    useRequestModalControls();

  const load = useCallback(
    async (options?: {
      forceRefresh?: boolean;
    }): Promise<{ ok: true } | { ok: false; error: ApiError }> => {
      if (loadInFlightRef.current) {
        return { ok: false, error: toApiError(null, 'Unable to load meeting channels right now.') };
      }
      loadInFlightRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const data = await supervisorApi.getProjectMeetingChannels(
          projectId,
          options?.forceRefresh ?? false,
        );
        const next = sortMeetingChannels(data);
        setChannels(next);
        setHasLoaded(true);
        return { ok: true };
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to load meeting channels right now.');
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
    setChannels([]);
    setIsLoading(false);
    setHasLoaded(false);
    setError(null);
    setIsFormOpen(false);
    setFormMode('add');
    setEditingChannel(null);
    setPendingDelete(null);
    loadInFlightRef.current = false;
  }, [projectId]);

  const openAdd = useCallback(() => {
    setFormMode('add');
    setEditingChannel(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((channel: MeetingChannel) => {
    setFormMode('edit');
    setEditingChannel(channel);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingChannel(null);
    setFormMode('add');
  }, []);

  const openDelete = useCallback((channel: MeetingChannel) => {
    setPendingDelete(channel);
  }, []);

  const closeDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

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
          const created = await supervisorApi.createProjectMeetingChannel(projectId, payload);
          setChannels((current) =>
            sortMeetingChannels([created, ...current.filter((item) => item.id !== created.id)]),
          );
          openSuccessModal('Meeting channel added', 'Meeting channel was added successfully.');
        } else {
          const updated = await supervisorApi.updateProjectMeetingChannel(
            projectId,
            editingChannel!.id,
            payload,
          );
          setChannels((current) =>
            sortMeetingChannels(current.map((item) => (item.id === updated.id ? updated : item))),
          );
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
      projectId,
    ],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }

    const channelId = pendingDelete.id;
    openLoadingModal('Deleting meeting channel', 'Removing meeting channel from this project.');
    try {
      await supervisorApi.deleteProjectMeetingChannel(projectId, channelId);
      setChannels((current) => current.filter((item) => item.id !== channelId));
      closeDelete();
      openSuccessModal('Meeting channel deleted', 'Meeting channel was removed successfully.');
    } catch (caught) {
      const apiError = toApiError(caught, 'Unable to delete meeting channel right now.');
      openErrorModal('Unable to delete meeting channel', apiError, () => void confirmDelete());
    }
  }, [closeDelete, openErrorModal, openLoadingModal, openSuccessModal, pendingDelete, projectId]);

  const approve = useCallback(
    async (channel: MeetingChannel) => {
      openLoadingModal('Approving meeting channel', 'Approving the selected meeting channel.');
      try {
        const approved = await supervisorApi.approveProjectMeetingChannel(projectId, channel.id);
        setChannels((current) =>
          sortMeetingChannels(current.map((item) => (item.id === approved.id ? approved : item))),
        );
        openSuccessModal('Meeting channel approved', 'Meeting channel was approved successfully.');
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to approve meeting channel right now.');
        openErrorModal('Unable to approve meeting channel', apiError, () => void approve(channel));
      }
    },
    [openErrorModal, openLoadingModal, openSuccessModal, projectId],
  );

  const copyToClipboard = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        openErrorModal(
          'Copy failed',
          toApiError(null, 'Unable to copy value automatically.'),
          () => void copyToClipboard(value),
        );
        return false;
      }
    },
    [openErrorModal],
  );

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
