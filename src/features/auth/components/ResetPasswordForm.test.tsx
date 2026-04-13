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

    const panel = screen
      .getByText(/Requirement:\s*At least 12 characters\./i)
      .closest('div[aria-hidden]');
    const requirements = screen.getByText(/Requirement:\s*At least 12 characters\./i);
    const newPassword = screen.getByLabelText('New Password');

    expect(panel).toHaveAttribute('aria-hidden', 'true');
    fireEvent.focus(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'false');
    expect(
      requirements.compareDocumentPosition(newPassword) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });

  it('hides panel on blur when new password is still empty', () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    const panel = screen
      .getByText(/Requirement:\s*At least 12 characters\./i)
      .closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New Password');

    fireEvent.focus(newPassword);
    fireEvent.blur(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps full panel visible after blur when password is weak', () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    const panel = screen
      .getByText(/Requirement:\s*At least 12 characters\./i)
      .closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New Password');

    fireEvent.focus(newPassword);
    fireEvent.change(newPassword, { target: { value: 'short' } });
    fireEvent.blur(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText(/Requirement:\s*At least 12 characters\./i)).toBeInTheDocument();
  });

  it('collapses to compact success on blur when password is strong, and expands again on focus', () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    const newPassword = screen.getByLabelText('New Password');

    fireEvent.focus(newPassword);
    fireEvent.change(newPassword, { target: { value: 'my dog loves eating pizza' } });
    fireEvent.blur(newPassword);

    expect(screen.getByText('✓ Strong password')).toBeInTheDocument();
    expect(screen.queryByText(/Requirement:\s*At least 12 characters\./i)).not.toBeInTheDocument();

    fireEvent.focus(newPassword);
    expect(screen.getByText(/Requirement:\s*At least 12 characters\./i)).toBeInTheDocument();
  });

  it('confirm field focus does not control helper state', () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    const confirmPassword = screen.getByLabelText('Confirm New Password');
    fireEvent.focus(confirmPassword);
    expect(screen.queryByText(/Requirement:\s*At least 12 characters\./i)).toBeInTheDocument();
    const panel = screen
      .getByText(/Requirement:\s*At least 12 characters\./i)
      .closest('div[aria-hidden]');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows match icon only on confirm field (not on new password field)', async () => {
    render(
      <ResetPasswordForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        isLoading={false}
        onClearError={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'long passphrase one' },
    });
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
