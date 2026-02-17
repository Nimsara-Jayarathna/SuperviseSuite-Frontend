import type { ReactNode } from 'react';

export function Card({ children }: { children?: ReactNode }) {
  return <div>{children ?? 'Card Placeholder'}</div>;
}
