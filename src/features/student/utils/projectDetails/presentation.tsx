import { AlertCircle, CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import type {
  StudentProjectDetailMember,
  StudentProjectDetailMilestone,
  StudentProjectLifecycle,
} from '../../types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export type StatusBadgeTone = NonNullable<ComponentProps<typeof StatusBadge>['tone']>;

export function memberDisplayName(member: StudentProjectDetailMember): string {
  return `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.email;
}

export function getLifecycleTone(status: StudentProjectLifecycle | string): StatusBadgeTone {
  switch (status) {
    case 'PLANNING':
      return 'student';
    case 'ACTIVE':
      return 'success';
    case 'AT_RISK':
      return 'warning';
    case 'BEHIND':
      return 'danger';
    case 'COMPLETED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function getMilestoneTone(
  status: StudentProjectDetailMilestone['status'] | string,
): StatusBadgeTone {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'student'; // using student for sky/blue feel
    case 'PLANNED':
      return 'neutral';
    case 'MISSED':
      return 'danger';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function getMilestoneStatusIconComponent(status: StudentProjectDetailMilestone['status'] | string) {
  switch (status) {
    case 'COMPLETED':
      return CheckCircle2;
    case 'IN_PROGRESS':
      return Clock;
    case 'PLANNED':
      return Circle;
    case 'MISSED':
      return AlertCircle;
    case 'CANCELLED':
      return XCircle;
    default:
      return Circle;
  }
}

export function getMilestoneStatusIcon(
  status: StudentProjectDetailMilestone['status'] | string,
  className?: string,
): ReactNode {
  const Icon = getMilestoneStatusIconComponent(status);
  return <Icon className={className} />;
}
