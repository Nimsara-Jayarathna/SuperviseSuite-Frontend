import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ApiError } from '@/types';
import { AppShell } from './AppShell';
import { useBlockingError } from './BlockingErrorContext';

vi.mock('@/components/ui/TopBar', () => ({
  TopBar: ({ onOpenAccount }: { onOpenAccount: () => void }) => (
    <button type="button" onClick={onOpenAccount}>
      Open account
    </button>
  ),
}));

function makeApiError(overrides: Partial<ApiError> = {}): ApiError {
  return {
    timestamp: '2026-04-12T00:00:00Z',
    status: 429,
    error: 'Too Many Requests',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please try again later.',
    path: '/api/student/projects',
    traceId: null,
    details: [],
    ...overrides,
  };
}

function BlockingErrorHarness({ onRetry }: { onRetry?: () => void | Promise<void> }) {
  const { showBlockingError, clearBlockingError } = useBlockingError();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          showBlockingError(makeApiError(), onRetry);
        }}
      >
        Show blocking
      </button>
      <button
        type="button"
        onClick={() => {
          clearBlockingError();
        }}
      >
        Clear blocking
      </button>
    </div>
  );
}

describe('AppShell blocking modal', () => {
  it('shows blocking modal and calls retry callback', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn().mockResolvedValue(undefined);

    render(
      <AppShell
        role="student"
        homePath="/student"
        navItems={[]}
        userName="Jane"
        userEmail="jane@example.com"
        userRole="STUDENT"
        onLogout={vi.fn().mockResolvedValue(undefined)}
      >
        <BlockingErrorHarness onRetry={onRetry} />
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: 'Show blocking' }));

    expect(await screen.findByText('Too many requests')).toBeInTheDocument();
    expect(screen.getByText('Too many requests. Please try again later.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state while retry is pending', async () => {
    const user = userEvent.setup();
    let resolveRetry: (() => void) | null = null;
    const onRetry = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRetry = resolve;
        }),
    );

    render(
      <AppShell
        role="student"
        homePath="/student"
        navItems={[]}
        userName="Jane"
        userEmail="jane@example.com"
        userRole="STUDENT"
        onLogout={vi.fn().mockResolvedValue(undefined)}
      >
        <BlockingErrorHarness onRetry={onRetry} />
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: 'Show blocking' }));
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Retrying request')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we try your request again.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();

    resolveRetry?.();

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('Too many requests')).toBeInTheDocument();
  });

  it('clears blocking modal when context clear is called', async () => {
    const user = userEvent.setup();

    render(
      <AppShell
        role="student"
        homePath="/student"
        navItems={[]}
        userName="Jane"
        userEmail="jane@example.com"
        userRole="STUDENT"
        onLogout={vi.fn().mockResolvedValue(undefined)}
      >
        <BlockingErrorHarness />
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: 'Show blocking' }));
    expect(await screen.findByText('Too many requests')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear blocking' }));

    await waitFor(() => {
      expect(screen.queryByText('Too many requests')).not.toBeInTheDocument();
    });
  });
});
