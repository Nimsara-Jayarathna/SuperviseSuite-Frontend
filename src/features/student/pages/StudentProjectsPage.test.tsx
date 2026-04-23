import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { StudentProjectsPage } from './StudentProjectsPage';

const { useStudentProjectsMock, showBlockingErrorMock, clearBlockingErrorMock } = vi.hoisted(
  () => ({
    useStudentProjectsMock: vi.fn(),
    showBlockingErrorMock: vi.fn(),
    clearBlockingErrorMock: vi.fn(),
  }),
);

vi.mock('../hooks/useStudentProjects', () => ({
  useStudentProjects: useStudentProjectsMock,
}));

vi.mock('@/app/layout/BlockingErrorContext', () => ({
  useBlockingError: () => ({
    showBlockingError: showBlockingErrorMock,
    clearBlockingError: clearBlockingErrorMock,
  }),
}));

vi.mock('@/components/ui/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('../components/StudentProjectCard', () => ({
  StudentProjectCard: ({ project }: { project: { title: string } }) => <div>{project.title}</div>,
}));

vi.mock('../components/StudentProjectCardSkeleton', () => ({
  StudentProjectCardSkeleton: () => <div>loading-card</div>,
}));

vi.mock('@/components/feedback/ErrorState', () => ({
  ErrorState: ({ error }: { error: { message: string } }) => (
    <div>inline-error:{error.message}</div>
  ),
}));

vi.mock('@/components/feedback/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe('StudentProjectsPage error routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes blocking errors to global blocking modal callback', () => {
    const error = {
      timestamp: '2026-04-12T00:00:00Z',
      status: 429,
      error: 'Too Many Requests',
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limited',
      path: '/api/student/projects',
      traceId: null,
      details: [],
    };

    useStudentProjectsMock.mockReturnValue({
      projects: [],
      isLoading: false,
      error,
      reload: vi.fn(),
    });

    render(<StudentProjectsPage />);

    expect(showBlockingErrorMock).toHaveBeenCalledTimes(1);
    expect(showBlockingErrorMock).toHaveBeenCalledWith(error, expect.any(Function));
    expect(screen.queryByText('inline-error:Rate limited')).not.toBeInTheDocument();
  });

  it('keeps non-blocking errors in inline error state', () => {
    const error = {
      timestamp: '2026-04-12T00:00:00Z',
      status: 400,
      error: 'Bad Request',
      code: 'BAD_REQUEST',
      message: 'Bad input',
      path: '/api/student/projects',
      traceId: null,
      details: [],
    };

    useStudentProjectsMock.mockReturnValue({
      projects: [],
      isLoading: false,
      error,
      reload: vi.fn(),
    });

    render(<StudentProjectsPage />);

    expect(showBlockingErrorMock).not.toHaveBeenCalled();
    expect(screen.getByText('inline-error:Bad input')).toBeInTheDocument();
  });

  it('does not render supervisor New Project CTA', () => {
    useStudentProjectsMock.mockReturnValue({
      projects: [],
      isLoading: false,
      error: null,
      reload: vi.fn(),
    });

    render(<StudentProjectsPage />);

    expect(screen.queryByRole('link', { name: /new project/i })).not.toBeInTheDocument();
  });
});
