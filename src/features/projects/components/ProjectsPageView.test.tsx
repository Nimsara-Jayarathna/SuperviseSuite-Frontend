import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectsPageView } from './ProjectsPageView';

describe('ProjectsPageView', () => {
  it('uses searchAriaLabel when provided', () => {
    render(
      <ProjectsPageView
        title="Projects"
        subtitle="Subtitle"
        searchValue=""
        onSearchChange={vi.fn()}
        searchPlaceholder="Search projects"
        searchAriaLabel="Project search"
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        items={[] as string[]}
        renderItem={() => null}
        renderSkeleton={() => null}
        emptyState={{ title: 'Empty', description: 'None' }}
      />,
    );

    expect(screen.getByLabelText('Project search')).toBeInTheDocument();
  });

  it('falls back to using placeholder as aria-label', () => {
    render(
      <ProjectsPageView
        title="Projects"
        subtitle="Subtitle"
        searchValue=""
        onSearchChange={vi.fn()}
        searchPlaceholder="Search projects"
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        items={[] as string[]}
        renderItem={() => null}
        renderSkeleton={() => null}
        emptyState={{ title: 'Empty', description: 'None' }}
      />,
    );

    expect(screen.getByLabelText('Search projects')).toBeInTheDocument();
  });
});
