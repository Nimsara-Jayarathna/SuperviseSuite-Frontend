import type { MeetingRecord } from '../types';

function statusRank(status: MeetingRecord['status']) {
  return status === 'PENDING' ? 0 : 1;
}

function meetingDateRank(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

export function sortMeetingRecords(records: MeetingRecord[]) {
  return [...records].sort((left, right) => {
    const rankDiff = statusRank(left.status) - statusRank(right.status);
    if (rankDiff !== 0) return rankDiff;

    const meetingDiff = meetingDateRank(right.meetingDate) - meetingDateRank(left.meetingDate);
    if (meetingDiff !== 0) return meetingDiff;

    const createdDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    if (createdDiff !== 0) return createdDiff;

    return left.id.localeCompare(right.id);
  });
}
