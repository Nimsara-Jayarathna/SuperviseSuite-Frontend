import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiError } from '@/types';
import { studentApi } from '@/features/student/api/studentApi';
import type { MeetingChannel, MeetingChannelUpsertPayload } from '../types';
import { toApiError, type RequestModalState } from './requestModal';

type StudentMeetingChannelsState = {
  channels: MeetingChannel[];
  isLoading: boolean;
  error: ApiError | null;
  hasLoaded: boolean;
  isFormOpen: boolean;
  requestModal: RequestModalState;
  load: () => Promise<{ ok: true } | { ok: false; error: ApiError }>;
  refresh: () => Promise<void>;
  openAdd: () => void;
  closeForm: () => void;
  submitForm: (payload: MeetingChannelUpsertPayload) => Promise<void>;
  copyToClipboard: (value: string) => Promise<void>;
  closeRequestModal: () => void;
};

const INITIAL_REQUEST_MODAL: RequestModalState = {
  isOpen: false,
  status: 'loading',
  title: '',
  message: '',
  retryAction: null,
};

export function useStudentMeetingChannelsState(projectId: string): StudentMeetingChannelsState {
  const [channels, setChannels] = useState<MeetingChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const openErrorModal = useCallback((title: string, apiError: ApiError, retryAction: () => void) => {
    setRequestModal({
      isOpen: true,
      status: 'error',
      title,
      message: apiError.message,
      retryAction,
    });
  }, []);

  const load = useCallback(async (): Promise<{ ok: true } | { ok: false; error: ApiError }> => {
    if (loadInFlightRef.current) {
      return { ok: false, error: toApiError(null, 'Unable to load meeting channels right now.') };
    }
    loadInFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const data = await studentApi.getProjectMeetingChannels(projectId);
      setChannels(data);
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
  }, [projectId]);

  const refresh = useCallback(async () => {
    openLoadingModal('Refreshing meeting channels', 'Fetching the latest meeting channels for this project.');
    const result = await load();
    if (result.ok) {
      openSuccessModal('Meeting channels refreshed', 'You are viewing the latest meeting channels.');
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
    async (payload: MeetingChannelUpsertPayload) => {
      openLoadingModal('Submitting meeting channel', 'Submitting meeting channel for this project.');

      try {
        await studentApi.createProjectMeetingChannel(projectId, payload);
        openSuccessModal('Meeting channel submitted', 'Meeting channel was submitted for approval.');
        closeForm();
        await load();
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to submit meeting channel right now.');
        openErrorModal('Unable to submit meeting channel', apiError, () => void submitForm(payload));
      }
    },
    [closeForm, load, openErrorModal, openLoadingModal, openSuccessModal, projectId],
  );

  const copyToClipboard = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        openErrorModal(
          'Copy failed',
          toApiError(null, 'Unable to copy value automatically.'),
          () => void copyToClipboard(value),
        );
      }
    },
    [openErrorModal],
  );

  const canLoad = useMemo(() => !hasLoaded && !isLoading, [hasLoaded, isLoading]);

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
    requestModal,
    load,
    refresh,
    openAdd,
    closeForm,
    submitForm,
    copyToClipboard,
    closeRequestModal,
  };
}
