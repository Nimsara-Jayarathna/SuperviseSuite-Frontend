import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AuthDialogCard } from './AuthDialogCard';

describe('AuthDialogCard', () => {
  it('renders title and subtitle', () => {
    render(
      <AuthDialogCard title="Title" subtitle="Subtitle">
        <div>Content</div>
      </AuthDialogCard>,
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders modal header variant', () => {
    render(
      <AuthDialogCard headerVariant="modal" title="Modal title" subtitle="Modal subtitle">
        <div>Content</div>
      </AuthDialogCard>,
    );

    expect(screen.getByRole('heading', { name: 'Modal title' })).toBeInTheDocument();
    expect(screen.getByText('Modal subtitle')).toBeInTheDocument();
  });

  it('renders close button only when onClose is provided', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { rerender } = render(
      <AuthDialogCard title="Title">
        <div>Content</div>
      </AuthDialogCard>,
    );

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();

    rerender(
      <AuthDialogCard title="Title" onClose={onClose}>
        <div>Content</div>
      </AuthDialogCard>,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
