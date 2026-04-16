import type { LucideIcon } from 'lucide-react';
import { Link2, Users } from 'lucide-react';
import { siGooglemeet, siWhatsapp, siZoom } from 'simple-icons';
import type { MeetingChannelPlatform } from '../types';

type SimpleIconDisplay = {
  kind: 'simple-icon';
  label: string;
  path: string;
  hex: string;
};

type LucideIconDisplay = {
  kind: 'lucide';
  label: string;
  Icon: LucideIcon;
  hex?: string;
};

export type PlatformDisplay = SimpleIconDisplay | LucideIconDisplay;

const PLATFORM_DISPLAY: Record<MeetingChannelPlatform, PlatformDisplay> = {
  GOOGLE_MEET: {
    kind: 'simple-icon',
    label: 'Google Meet',
    path: siGooglemeet.path,
    hex: siGooglemeet.hex,
  },
  ZOOM: {
    kind: 'simple-icon',
    label: 'Zoom',
    path: siZoom.path,
    hex: siZoom.hex,
  },
  TEAMS: {
    kind: 'lucide',
    label: 'Microsoft Teams',
    Icon: Users,
    hex: '6264A7',
  },
  WHATSAPP: {
    kind: 'simple-icon',
    label: 'WhatsApp',
    path: siWhatsapp.path,
    hex: siWhatsapp.hex,
  },
  OTHER: {
    kind: 'lucide',
    label: 'Other',
    Icon: Link2,
  },
};

export function getMeetingPlatformDisplay(platform: MeetingChannelPlatform): PlatformDisplay {
  return PLATFORM_DISPLAY[platform];
}
