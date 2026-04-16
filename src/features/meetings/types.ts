export const MEETING_CHANNEL_PLATFORMS = [
  'GOOGLE_MEET',
  'ZOOM',
  'TEAMS',
  'WHATSAPP',
  'OTHER',
] as const;

export type MeetingChannelPlatform = (typeof MEETING_CHANNEL_PLATFORMS)[number];

export type MeetingChannelStatus = 'PENDING' | 'APPROVED';

export type MeetingChannel = {
  id: string;
  projectId: string;
  platform: MeetingChannelPlatform;
  channelName: string;
  linkOrIdentifier: string;
  addedBy: string;
  addedByName: string;
  addedByRole: 'SUPERVISOR' | 'STUDENT';
  status: MeetingChannelStatus;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type MeetingChannelUpsertPayload = {
  platform: MeetingChannelPlatform;
  channelName: string;
  linkOrIdentifier: string;
};

