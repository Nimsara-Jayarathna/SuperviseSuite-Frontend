import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ChangePasswordModal } from './ChangePasswordModal';

describe('ChangePasswordModal', () => {
  it('renders requirement card before new/confirm fields', () => {
    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    const requirements = screen.getByText(/Requirement:\s*At least 12 characters\./i);
    const newPassword = screen.getByLabelText('New password');

    expect(requirements.compareDocumentPosition(newPassword) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
