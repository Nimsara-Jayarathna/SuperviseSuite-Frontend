import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { SupervisorProjectsPage } from './SupervisorProjectsPage';

const { useSupervisorProjectsMock, showBlockingErrorMock, clearBlockingErrorMock } = vi.hoisted(
  () => ({
    useSupervisorProjectsMock: vi.fn(),
    showBlockingErrorMock: vi.fn(),
    clearBlockingErrorMock: vi.fn(),
  }),
);

vi.mock('../hooks/useSupervisorProjects', () => ({
  useSupervisorProjects: useSupervisorProjectsMock,
}));

vi.mock('@/app/layout/BlockingErrorContext', () => ({
  useBlockingError: () => ({
    showBlockingError: showBlockingErrorMock,
    clearBlockingError: clearBlockingErrorMock,
  }),
}));

vi.mock('../components/SupervisorProjectCard', () => ({
  SupervisorProjectCard: ({ project }: { project: { title: string } }) => (
    <div>{project.title}</div>
  ),
}));

vi.mock('../components/SupervisorProjectCardSkeleton', () => ({
  SupervisorProjectCardSkeleton: () => <div>loading-card</div>,
}));

vi.mock('@/components/feedback/ErrorState', () => ({
  ErrorState: ({ error }: { error: { message: string } }) => (
    <div>inline-error:{error.message}</div>
  ),
}));

vi.mock('@/components/feedback/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe('SupervisorProjectsPage header CTA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders New Project CTA with icon and correct route', () => {
    useSupervisorProjectsMock.mockReturnValue({
      projects: [],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SupervisorProjectsPage />
      </MemoryRouter>,
    );

    const cta = screen.getByRole('link', { name: /new project/i });
    expect(cta).toHaveAttribute('href', '/supervisor/projects/new');
    expect(cta.querySelector('svg')).toBeTruthy();
  });
});
