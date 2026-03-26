import type { LucideIcon } from 'lucide-react';

export type LandingFeatureCard = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export type LandingStepCard = {
  id: string;
  icon: LucideIcon;
  stepNumber: number;
  title: string;
  description: string;
};

export type LandingAudienceCard = {
  id: string;
  icon: LucideIcon;
  title: string;
  items: string[];
};
