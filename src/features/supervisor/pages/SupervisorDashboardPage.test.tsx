import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { SupervisorDashboardPage } from './SupervisorDashboardPage';

const { useSupervisorDashboardMock, showBlockingErrorMock, clearBlockingErrorMock } = vi.hoisted(
  () => ({
    useSupervisorDashboardMock: vi.fn(),
    showBlockingErrorMock: vi.fn(),
    clearBlockingErrorMock: vi.fn(),
  }),
);

vi.mock('../hooks/useSupervisorDashboard', () => ({
  useSupervisorDashboard: useSupervisorDashboardMock,
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

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Button', () => ({
  buttonStyles: () => 'btn',
}));

vi.mock('@/components/feedback/ErrorState', () => ({
  ErrorState: ({ error }: { error: { message: string } }) => (
    <div>inline-error:{error.message}</div>
  ),
}));

vi.mock('@/components/feedback/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe('SupervisorDashboardPage error routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes blocking errors to global blocking modal callback', () => {
    const error = {
      timestamp: '2026-04-12T00:00:00Z',
      status: 503,
      error: 'Service Unavailable',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service down',
      path: '/api/supervisor/dashboard',
      traceId: null,
      details: [],
    };

    useSupervisorDashboardMock.mockReturnValue({
      dashboard: null,
      isLoading: false,
      error,
      reload: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SupervisorDashboardPage />
      </MemoryRouter>,
    );

    expect(showBlockingErrorMock).toHaveBeenCalledTimes(1);
    expect(showBlockingErrorMock).toHaveBeenCalledWith(error, expect.any(Function));
    expect(screen.queryByText('inline-error:Service down')).not.toBeInTheDocument();
  });

  it('shows inline error for non-blocking failures', () => {
    const error = {
      timestamp: '2026-04-12T00:00:00Z',
      status: 400,
      error: 'Bad Request',
      code: 'BAD_REQUEST',
      message: 'Bad dashboard filters',
      path: '/api/supervisor/dashboard',
      traceId: null,
      details: [],
    };

    useSupervisorDashboardMock.mockReturnValue({
      dashboard: null,
      isLoading: false,
      error,
      reload: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SupervisorDashboardPage />
      </MemoryRouter>,
    );

    expect(showBlockingErrorMock).not.toHaveBeenCalled();
    expect(screen.getByText('inline-error:Bad dashboard filters')).toBeInTheDocument();
  });
});
