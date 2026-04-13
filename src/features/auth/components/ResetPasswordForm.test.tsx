import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';

describe('ResetPasswordForm', () => {
  it('shows requirements panel only when new password is focused', () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    const panel = screen.getByText(/Requirement:\s*At least 12 characters\./i).closest('div[aria-hidden]');
    const requirements = screen.getByText(/Requirement:\s*At least 12 characters\./i);
    const newPassword = screen.getByLabelText('New Password');

    expect(panel).toHaveAttribute('aria-hidden', 'true');
    fireEvent.focus(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'false');
    expect(requirements.compareDocumentPosition(newPassword) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('hides panel on blur when new password is still empty', () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    const panel = screen.getByText(/Requirement:\s*At least 12 characters\./i).closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New Password');

    fireEvent.focus(newPassword);
    fireEvent.blur(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps panel visible after blur when user has typed', () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    const panel = screen.getByText(/Requirement:\s*At least 12 characters\./i).closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New Password');

    fireEvent.focus(newPassword);
    fireEvent.change(newPassword, { target: { value: 'long passphrase one' } });
    fireEvent.blur(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'false');
  });

  it('shows match icon only on confirm field (not on new password field)', async () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'long passphrase one' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'long passphrase two' },
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
