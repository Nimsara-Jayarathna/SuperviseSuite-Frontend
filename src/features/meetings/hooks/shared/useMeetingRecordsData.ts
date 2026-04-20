import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiError } from '@/types';
import type { MeetingChannel, MeetingRecord, MeetingRecordUpsertPayload } from '../../types';
import { sortMeetingRecords } from '../../lib/sortMeetingRecords';
import { toApiError } from '../requestModal';

export type MeetingRecordsApiPort = {
  getProjectMeetingRecords: (projectId: string, forceRefresh?: boolean) => Promise<MeetingRecord[]>;
  getProjectMeetingChannels: (
    projectId: string,
    forceRefresh?: boolean,
  ) => Promise<MeetingChannel[]>;
  createProjectMeetingRecord: (
    projectId: string,
    payload: MeetingRecordUpsertPayload,
  ) => Promise<MeetingRecord>;
  updateProjectMeetingRecord: (
    projectId: string,
    recordId: string,
    payload: MeetingRecordUpsertPayload,
  ) => Promise<MeetingRecord>;
  deleteProjectMeetingRecord: (projectId: string, recordId: string) => Promise<void>;
  approveProjectMeetingRecord: (projectId: string, recordId: string) => Promise<MeetingRecord>;
};

export type MeetingLoadResult = { ok: true } | { ok: false; error: ApiError };

type UseMeetingRecordsDataOptions = {
  projectId: string;
  enabled?: boolean;
  api: MeetingRecordsApiPort;
};

type MeetingRecordsData = {
  records: MeetingRecord[];
  channels: MeetingChannel[];
  isLoading: boolean;
  error: ApiError | null;
  hasLoaded: boolean;
  load: (options?: { forceRefresh?: boolean }) => Promise<MeetingLoadResult>;
  createRecord: (payload: MeetingRecordUpsertPayload) => Promise<MeetingRecord>;
  updateRecord: (recordId: string, payload: MeetingRecordUpsertPayload) => Promise<MeetingRecord>;
  deleteRecord: (recordId: string) => Promise<void>;
  approveRecord: (recordId: string) => Promise<MeetingRecord>;
};

export function useMeetingRecordsData({
  projectId,
  enabled = true,
  api,
}: UseMeetingRecordsDataOptions): MeetingRecordsData {
  const [records, setRecords] = useState<MeetingRecord[]>([]);
  const [channels, setChannels] = useState<MeetingChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const loadInFlightRef = useRef(false);

  const load = useCallback(
    async (options?: { forceRefresh?: boolean }): Promise<MeetingLoadResult> => {
      if (loadInFlightRef.current) {
        return { ok: false, error: toApiError(null, 'Unable to load meeting records right now.') };
      }

      loadInFlightRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const [loadedRecords, loadedChannels] = await Promise.all([
          api.getProjectMeetingRecords(projectId, options?.forceRefresh ?? false),
          api.getProjectMeetingChannels(projectId, options?.forceRefresh ?? false),
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
    [api, projectId],
  );

  const createRecord = useCallback(
    async (payload: MeetingRecordUpsertPayload): Promise<MeetingRecord> => {
      const created = await api.createProjectMeetingRecord(projectId, payload);
      setRecords((current) =>
        sortMeetingRecords([created, ...current.filter((item) => item.id !== created.id)]),
      );
      return created;
    },
    [api, projectId],
  );

  const updateRecord = useCallback(
    async (recordId: string, payload: MeetingRecordUpsertPayload): Promise<MeetingRecord> => {
      const updated = await api.updateProjectMeetingRecord(projectId, recordId, payload);
      setRecords((current) =>
        sortMeetingRecords(current.map((item) => (item.id === updated.id ? updated : item))),
      );
      return updated;
    },
    [api, projectId],
  );

  const deleteRecord = useCallback(
    async (recordId: string): Promise<void> => {
      await api.deleteProjectMeetingRecord(projectId, recordId);
      setRecords((current) => current.filter((item) => item.id !== recordId));
    },
    [api, projectId],
  );

  const approveRecord = useCallback(
    async (recordId: string): Promise<MeetingRecord> => {
      const approved = await api.approveProjectMeetingRecord(projectId, recordId);
      setRecords((current) =>
        sortMeetingRecords(current.map((item) => (item.id === approved.id ? approved : item))),
      );
      return approved;
    },
    [api, projectId],
  );

  useEffect(() => {
    setRecords([]);
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
  };
}
