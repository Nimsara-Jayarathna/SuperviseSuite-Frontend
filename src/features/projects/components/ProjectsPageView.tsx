import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { buttonStyles } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { ApiError } from '@/types';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ProjectsPageAction = {
  to: string;
  label: string;
  icon?: ReactNode;
};

type ProjectsPageFilterOption = {
  value: string;
  label: string;
};

type ProjectsPageFilter = {
  value: string;
  onChange: (nextValue: string) => void;
  options: ProjectsPageFilterOption[];
};

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

type ProjectsPageEmptyState = {
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
};

type ProjectsPageViewProps<TItem> = {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (nextValue: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  action?: ProjectsPageAction;
  filter?: ProjectsPageFilter;
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  items: TItem[];
  renderItem: (item: TItem) => ReactNode;
  renderSkeleton: (index: number) => ReactNode;
  skeletonCount?: number;
  listGridClassName?: string;
  emptyState: ProjectsPageEmptyState;
  rootClassName?: string;
};

export function ProjectsPageView<TItem>({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  action,
  filter,
  isLoading,
  error,
  onRetry,
  items,
  renderItem,
  renderSkeleton,
  skeletonCount = 4,
  listGridClassName = 'grid gap-4 xl:grid-cols-2 2xl:grid-cols-3',
  emptyState,
  rootClassName = 'space-y-6',
}: ProjectsPageViewProps<TItem>) {
  return (
    <div className={rootClassName}>
      <section className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {subtitle}
          </p>
        </div>
        {action ? (
          <Link
            to={action.to}
            className={buttonStyles({
              variant: 'primary',
              size: 'md',
              className: 'shrink-0 whitespace-nowrap',
            })}
          >
            {action.icon}
            {action.label}
          </Link>
        ) : null}
      </section>

      <section
        className={`grid gap-2.5 sm:gap-3 ${filter ? 'md:grid-cols-[minmax(0,1fr)_210px]' : ''} md:gap-4`}
      >
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel ?? searchPlaceholder}
          className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
        />
        {filter ? (
          <Select
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            className="h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition-colors focus:border-amber-300"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : null}
      </section>

      {isLoading ? (
        <section className={listGridClassName}>
          {Array.from({ length: skeletonCount }).map((_, index) => renderSkeleton(index))}
        </section>
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : items.length > 0 ? (
        <section className={listGridClassName}>{items.map((item) => renderItem(item))}</section>
      ) : (
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          primaryAction={emptyState.primaryAction}
          secondaryAction={emptyState.secondaryAction}
        />
      )}
    </div>
  );
}
