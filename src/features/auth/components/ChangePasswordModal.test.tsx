import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ApiException } from '@/services/apiClient';

describe('ChangePasswordModal', () => {
  it('shows requirements panel only when new password is focused', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    const panel = screen
      .getByText(/Requirement:\s*At least 12 characters\./i)
      .closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New password');

    expect(panel).toHaveAttribute('aria-hidden', 'true');
    fireEvent.focus(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'false');
  });

  it('hides panel on blur when new password is empty', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    const panel = screen
      .getByText(/Requirement:\s*At least 12 characters\./i)
      .closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New password');

    fireEvent.focus(newPassword);
    fireEvent.blur(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps full panel visible after blur when new password is weak', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    const panel = screen
      .getByText(/Requirement:\s*At least 12 characters\./i)
      .closest('div[aria-hidden]');
    const newPassword = screen.getByLabelText('New password');

    fireEvent.focus(newPassword);
    fireEvent.change(newPassword, { target: { value: 'short' } });
    fireEvent.blur(newPassword);
    expect(panel).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText(/Requirement:\s*At least 12 characters\./i)).toBeInTheDocument();
  });

  it('collapses to compact success on blur when password is strong, and expands again on focus', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    const newPassword = screen.getByLabelText('New password');

    fireEvent.focus(newPassword);
    fireEvent.change(newPassword, { target: { value: 'my dog loves eating pizza' } });
    fireEvent.blur(newPassword);

    expect(screen.getByText('✓ Strong password')).toBeInTheDocument();
    expect(screen.queryByText(/Requirement:\s*At least 12 characters\./i)).not.toBeInTheDocument();

    fireEvent.focus(newPassword);
    expect(screen.getByText(/Requirement:\s*At least 12 characters\./i)).toBeInTheDocument();
  });

  it('shows mismatch tooltip on confirm new password mismatch', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'long passphrase one' },
    });
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

  it('shows field-level newPassword backend error instead of generic validation message', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiException({
        code: 'VALIDATION_ERROR',
        status: 400,
        message: 'Validation failed.',
        details: [
          {
            field: 'newPassword',
            issue: 'New password must be different from current password.',
          },
        ],
        timestamp: '2026-04-14T00:00:00Z',
        path: '/api/supervisor/me/password',
        traceId: null,
      }),
    );

    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'Current passphrase 123!' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'A very strong new passphrase 123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'A very strong new passphrase 123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(
      await screen.findByText('New password must be different from current password.'),
    ).toBeInTheDocument();
  });
});
