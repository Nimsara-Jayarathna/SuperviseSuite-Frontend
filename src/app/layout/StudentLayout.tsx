import type { ReactNode } from 'react';

export function StudentLayout({ children }: { children?: ReactNode }) {
  return <div>{children ?? 'Student Layout Placeholder'}</div>;
}
