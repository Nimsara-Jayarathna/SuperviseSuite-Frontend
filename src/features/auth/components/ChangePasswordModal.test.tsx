import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ChangePasswordModal } from './ChangePasswordModal';

describe('ChangePasswordModal', () => {
  it('shows requirements panel only when new password is focused', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    const panel = screen.getByText(/Requirement:\s*At least 12 characters\./i).closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New password');

    expect(panel).toHaveAttribute('aria-hidden', 'true');
    fireEvent.focus(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'false');
  });

  it('hides panel on blur when new password is empty', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    const panel = screen.getByText(/Requirement:\s*At least 12 characters\./i).closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New password');

    fireEvent.focus(newPassword);
    fireEvent.blur(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps panel visible after blur when new password has value', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    const panel = screen.getByText(/Requirement:\s*At least 12 characters\./i).closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New password');

    fireEvent.focus(newPassword);
    fireEvent.change(newPassword, { target: { value: 'long passphrase one' } });
    fireEvent.blur(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'false');
  });

  it('shows mismatch tooltip on confirm new password mismatch', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'long passphrase one' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'long passphrase two' },
    });

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Passwords do not match.',
    );
  });

  it('toggles show/hide for current password field', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    const currentPassword = screen.getByLabelText('Current password') as HTMLInputElement;
    const currentToggle = screen.getAllByRole('button', { name: 'Show password' })[0];

    expect(currentPassword.type).toBe('password');
    fireEvent.click(currentToggle);
    expect(currentPassword.type).toBe('text');
    expect(currentToggle).toHaveAttribute('aria-label', 'Hide password');
  });
});
