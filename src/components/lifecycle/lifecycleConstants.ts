export const LIFECYCLE_VALUES = ['PLANNING', 'ACTIVE', 'AT_RISK', 'BEHIND', 'COMPLETED'] as const;

export type LifecycleValue = (typeof LIFECYCLE_VALUES)[number];

export type LifecycleTone = 'student' | 'success' | 'warning' | 'danger' | 'neutral';

export function formatLifecycleLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export function getLifecycleTone(status: string): LifecycleTone {
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

export function getLifecycleDotClass(status: string) {
  const tone = getLifecycleTone(status);
  switch (tone) {
    case 'student':
      return 'bg-sky-500';
    case 'success':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'danger':
      return 'bg-rose-500';
    case 'neutral':
    default:
      return 'bg-slate-400';
  }
}
