import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiError } from '@/types';
import type { MeetingChannel, MeetingChannelUpsertPayload } from '../../types';
import { sortMeetingChannels } from '../../lib/sortMeetingChannels';
import { toApiError } from '../requestModal';
import type { MeetingLoadResult } from './useMeetingRecordsData';

export type MeetingChannelsApiPort = {
  getProjectMeetingChannels: (
    projectId: string,
    forceRefresh?: boolean,
  ) => Promise<MeetingChannel[]>;
  createProjectMeetingChannel: (
    projectId: string,
    payload: MeetingChannelUpsertPayload,
  ) => Promise<MeetingChannel>;
  updateProjectMeetingChannel: (
    projectId: string,
    channelId: string,
    payload: MeetingChannelUpsertPayload,
  ) => Promise<MeetingChannel>;
  deleteProjectMeetingChannel: (projectId: string, channelId: string) => Promise<void>;
  approveProjectMeetingChannel: (projectId: string, channelId: string) => Promise<MeetingChannel>;
};

type UseMeetingChannelsDataOptions = {
  projectId: string;
  enabled?: boolean;
  api: MeetingChannelsApiPort;
};

type MeetingChannelsData = {
  channels: MeetingChannel[];
  isLoading: boolean;
  error: ApiError | null;
  hasLoaded: boolean;
  load: (options?: { forceRefresh?: boolean }) => Promise<MeetingLoadResult>;
  createChannel: (payload: MeetingChannelUpsertPayload) => Promise<MeetingChannel>;
  updateChannel: (
    channelId: string,
    payload: MeetingChannelUpsertPayload,
  ) => Promise<MeetingChannel>;
  deleteChannel: (channelId: string) => Promise<void>;
  approveChannel: (channelId: string) => Promise<MeetingChannel>;
};

export function useMeetingChannelsData({
  projectId,
  enabled = true,
  api,
}: UseMeetingChannelsDataOptions): MeetingChannelsData {
  const [channels, setChannels] = useState<MeetingChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const loadInFlightRef = useRef(false);

  const load = useCallback(
    async (options?: { forceRefresh?: boolean }): Promise<MeetingLoadResult> => {
      if (loadInFlightRef.current) {
        return { ok: false, error: toApiError(null, 'Unable to load meeting channels right now.') };
      }

      loadInFlightRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.getProjectMeetingChannels(projectId, options?.forceRefresh ?? false);
        setChannels(sortMeetingChannels(data));
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
    [api, projectId],
  );

  const createChannel = useCallback(
    async (payload: MeetingChannelUpsertPayload): Promise<MeetingChannel> => {
      const created = await api.createProjectMeetingChannel(projectId, payload);
      setChannels((current) =>
        sortMeetingChannels([created, ...current.filter((item) => item.id !== created.id)]),
      );
      return created;
    },
    [api, projectId],
  );

  const updateChannel = useCallback(
    async (channelId: string, payload: MeetingChannelUpsertPayload): Promise<MeetingChannel> => {
      const updated = await api.updateProjectMeetingChannel(projectId, channelId, payload);
      setChannels((current) =>
        sortMeetingChannels(current.map((item) => (item.id === updated.id ? updated : item))),
      );
      return updated;
    },
    [api, projectId],
  );

  const deleteChannel = useCallback(
    async (channelId: string): Promise<void> => {
      await api.deleteProjectMeetingChannel(projectId, channelId);
      setChannels((current) => current.filter((item) => item.id !== channelId));
    },
    [api, projectId],
  );

  const approveChannel = useCallback(
    async (channelId: string): Promise<MeetingChannel> => {
      const approved = await api.approveProjectMeetingChannel(projectId, channelId);
      setChannels((current) =>
        sortMeetingChannels(current.map((item) => (item.id === approved.id ? approved : item))),
      );
      return approved;
    },
    [api, projectId],
  );

  useEffect(() => {
    setChannels([]);
    setIsLoading(false);
    setHasLoaded(false);
    setError(null);
    loadInFlightRef.current = false;
  }, [projectId]);

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
    load,
    createChannel,
    updateChannel,
    deleteChannel,
    approveChannel,
  };
}
