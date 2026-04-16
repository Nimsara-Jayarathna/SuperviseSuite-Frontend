import type { LucideIcon } from 'lucide-react';
import { Camera, Link2, MessageCircle, Users, Video } from 'lucide-react';
import type { MeetingChannelPlatform } from '../types';

type PlatformDisplay = {
  label: string;
  Icon: LucideIcon;
  toneClassName: string;
};

const PLATFORM_DISPLAY: Record<MeetingChannelPlatform, PlatformDisplay> = {
  GOOGLE_MEET: {
    label: 'Google Meet',
    Icon: Video,
    toneClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  ZOOM: {
    label: 'Zoom',
    Icon: Camera,
    toneClassName: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  TEAMS: {
    label: 'Teams',
    Icon: Users,
    toneClassName: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  WHATSAPP: {
    label: 'WhatsApp',
    Icon: MessageCircle,
    toneClassName: 'border-green-200 bg-green-50 text-green-700',
  },
  OTHER: {
    label: 'Other',
    Icon: Link2,
    toneClassName: 'border-slate-200 bg-slate-100 text-slate-700',
  },
};

export function getMeetingPlatformDisplay(platform: MeetingChannelPlatform): PlatformDisplay {
  return PLATFORM_DISPLAY[platform];
}
