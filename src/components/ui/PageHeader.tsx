import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl min-w-0">
        <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-stretch gap-2.5 sm:items-center lg:w-auto">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
