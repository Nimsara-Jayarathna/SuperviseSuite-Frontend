import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from '@/types';
import { studentApi } from '@/features/student/api/studentApi';
import type { MeetingChannel, MeetingChannelUpsertPayload } from '../types';
import { toApiError } from './requestModal';
import { useRequestModalControls } from './useRequestModalControls';
import { useMeetingChannelsData } from './shared/useMeetingChannelsData';
import { useCopyToClipboard } from './shared/useCopyToClipboard';

type StudentMeetingChannelsState = {
  channels: MeetingChannel[];
  isLoading: boolean;
  error: ApiError | null;
  hasLoaded: boolean;
  isFormOpen: boolean;
  requestModal: ReturnType<typeof useRequestModalControls>['requestModal'];
  load: (options?: {
    forceRefresh?: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: ApiError }>;
  refresh: () => Promise<void>;
  openAdd: () => void;
  closeForm: () => void;
  submitForm: (payload: MeetingChannelUpsertPayload) => Promise<void>;
  copyToClipboard: (value: string) => Promise<boolean>;
  closeRequestModal: () => void;
};

export function useStudentMeetingChannelsState(
  projectId: string,
  enabled = true,
): StudentMeetingChannelsState {
  const { channels, isLoading, error, hasLoaded, load, createChannel } = useMeetingChannelsData({
    projectId,
    enabled,
    api: studentApi,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
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
    setIsFormOpen(false);
  }, [projectId]);

  const openAdd = useCallback(() => {
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
  }, []);

  const submitForm = useCallback(
    async (payload: MeetingChannelUpsertPayload) => {
      openLoadingModal(
        'Submitting meeting channel',
        'Submitting meeting channel for this project.',
      );

      try {
        await createChannel(payload);
        openSuccessModal(
          'Meeting channel submitted',
          'Meeting channel was submitted for approval.',
        );
        closeForm();
      } catch (caught) {
        const apiError = toApiError(caught, 'Unable to submit meeting channel right now.');
        openErrorModal(
          'Unable to submit meeting channel',
          apiError,
          () => void submitForm(payload),
        );
      }
    },
    [closeForm, createChannel, openErrorModal, openLoadingModal, openSuccessModal],
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
