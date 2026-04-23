import { useEffect, useState } from 'react';

type MeetingChannelLike = {
  status?: string | null;
  platform?: string | null;
};

type MeetingRecordLike = {
  status?: string | null;
};

type MeetingAnalyticsFetchers = {
  getMeetingChannels: (projectId: string) => Promise<MeetingChannelLike[]>;
  getMeetingRecords: (projectId: string) => Promise<MeetingRecordLike[]>;
};

export type MeetingAnalyticsState = {
  loading: boolean;
  channels: number | null;
  records: number | null;
  approvedChannels: number | null;
  pendingRecords: number | null;
  platformTypes: number | null;
};

const EMPTY_ANALYTICS: MeetingAnalyticsState = {
  loading: false,
  channels: null,
  records: null,
  approvedChannels: null,
  pendingRecords: null,
  platformTypes: null,
};

export function useMeetingAnalytics(
  projectId: string | null | undefined,
  fetchers: MeetingAnalyticsFetchers,
): MeetingAnalyticsState {
  const [analytics, setAnalytics] = useState<MeetingAnalyticsState>(EMPTY_ANALYTICS);
  const { getMeetingChannels, getMeetingRecords } = fetchers;

  useEffect(() => {
    if (!projectId) {
      setAnalytics(EMPTY_ANALYTICS);
      return;
    }

    let active = true;
    setAnalytics((current) => ({ ...current, loading: true }));

    Promise.all([getMeetingChannels(projectId), getMeetingRecords(projectId)])
      .then(([channels, records]) => {
        if (!active) {
          return;
        }
        setAnalytics({
          loading: false,
          channels: channels.length,
          records: records.length,
          approvedChannels: channels.filter((channel) => channel.status === 'APPROVED').length,
          pendingRecords: records.filter((record) => record.status === 'PENDING').length,
          platformTypes: new Set(
            channels
              .map((channel) => channel.platform)
              .filter((platform): platform is string => Boolean(platform)),
          ).size,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setAnalytics({
          loading: false,
          channels: null,
          records: null,
          approvedChannels: null,
          pendingRecords: null,
          platformTypes: null,
        });
      });

    return () => {
      active = false;
    };
  }, [projectId, getMeetingChannels, getMeetingRecords]);

  return analytics;
}
