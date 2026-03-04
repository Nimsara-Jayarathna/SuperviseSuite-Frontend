import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

type EmptyStateProps = {
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
};

export function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed px-6 py-10">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>

        {primaryAction || secondaryAction ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {primaryAction ? (
              <Button variant="primary" size="md" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            ) : null}
            {secondaryAction ? (
              <Button variant="secondary" size="md" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
