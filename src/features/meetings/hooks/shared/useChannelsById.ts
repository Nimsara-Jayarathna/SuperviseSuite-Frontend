import { useMemo } from 'react';
import type { MeetingChannel } from '../../types';

export function useChannelsById(channels: MeetingChannel[]) {
  return useMemo(() => {
    return Object.fromEntries(channels.map((channel) => [channel.id, channel]));
  }, [channels]);
}
