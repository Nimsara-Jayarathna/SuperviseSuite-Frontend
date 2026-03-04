import type { ReactNode } from 'react';

type ProjectCardFooterProps = {
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
};

export function ProjectCardFooter({ primaryAction, secondaryAction }: ProjectCardFooterProps) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {primaryAction}
      {secondaryAction ?? <span aria-hidden="true" />}
    </div>
  );
}
