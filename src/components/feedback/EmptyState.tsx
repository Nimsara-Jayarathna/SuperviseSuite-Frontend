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
    <section className="rounded-3xl border border-dashed border-border bg-white px-6 py-12 shadow-sm">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>

        {primaryAction || secondaryAction ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {primaryAction ? (
              <Button
                variant="hero"
                className="h-10 rounded-2xl px-4"
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </Button>
            ) : null}
            {secondaryAction ? (
              <Button
                variant="hero-outline"
                className="h-10 rounded-2xl px-4"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
