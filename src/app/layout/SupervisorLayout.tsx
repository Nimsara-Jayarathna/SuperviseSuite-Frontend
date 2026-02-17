import type { ReactNode } from 'react';

export function SupervisorLayout({ children }: { children?: ReactNode }) {
  return <div>{children ?? 'Supervisor Layout Placeholder'}</div>;
}
