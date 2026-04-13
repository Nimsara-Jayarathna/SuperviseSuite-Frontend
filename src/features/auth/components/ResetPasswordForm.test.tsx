import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';

describe('ResetPasswordForm', () => {
  it('renders password requirements panel before new/confirm fields', () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    const requirements = screen.getByText('Password requirements');
    const newPassword = screen.getByLabelText('New Password');

    expect(requirements.compareDocumentPosition(newPassword) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows match icon only on confirm field (not on new password field)', async () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'Secure@123' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'Secure@124' },
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Passwords do not match.');
  });

  it('toggles show/hide password visibility', () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    const newPasswordInput = screen.getByLabelText('New Password') as HTMLInputElement;
    const showButtons = screen.getAllByRole('button', { name: 'Show password' });
    const newPasswordToggle = showButtons[0];

    expect(newPasswordInput.type).toBe('password');
    fireEvent.click(newPasswordToggle);
    expect(newPasswordInput.type).toBe('text');
    expect(newPasswordToggle).toHaveAttribute('aria-label', 'Hide password');
  });
});
