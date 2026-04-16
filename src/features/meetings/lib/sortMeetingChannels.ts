import type { MeetingChannel } from '../types';

function statusRank(status: MeetingChannel['status']) {
  return status === 'PENDING' ? 0 : 1;
}

export function sortMeetingChannels(channels: MeetingChannel[]) {
  return [...channels].sort((left, right) => {
    const rankDiff = statusRank(left.status) - statusRank(right.status);
    if (rankDiff !== 0) return rankDiff;

    const createdDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    if (createdDiff !== 0) return createdDiff;

    return left.id.localeCompare(right.id);
  });
}
