import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RequestStateModal } from './RequestStateModal';

describe('RequestStateModal', () => {
  it('does not render when closed', () => {
    render(
      <RequestStateModal isOpen={false} status="error" title="Error" message="Something failed" />,
    );

    expect(screen.queryByText('Something failed')).not.toBeInTheDocument();
  });

  it('shows retry and close actions for error state when handlers are provided', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onClose = vi.fn();

    render(
      <RequestStateModal
        isOpen={true}
        status="error"
        title="Error"
        message="Something failed"
        onRetry={onRetry}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides footer actions in loading state', () => {
    render(
      <RequestStateModal
        isOpen={true}
        status="loading"
        title="Loading"
        message="Please wait"
        onRetry={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('auto closes success status after timeout when enabled', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(
      <RequestStateModal
        isOpen={true}
        status="success"
        title="Success"
        message="Completed"
        onClose={onClose}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
