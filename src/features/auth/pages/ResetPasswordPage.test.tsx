import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ApiException } from '@/services/apiClient';
import { ResetPasswordPage } from './ResetPasswordPage';

const { validateResetTokenMock, resetPasswordMock, logoutMock, navigateMock } = vi.hoisted(() => ({
  validateResetTokenMock: vi.fn(),
  resetPasswordMock: vi.fn(),
  logoutMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('../api/authApi', () => ({
  authApi: {
    validateResetToken: validateResetTokenMock,
    resetPassword: resetPasswordMock,
    logout: logoutMock,
  },
}));

vi.mock('@/features/landing', () => ({
  LandingPage: () => <div>landing</div>,
}));

vi.mock('@/services/sessionCache', () => ({
  clearSessionCaches: vi.fn(),
}));

vi.mock('@/services/tokenStorage', () => ({
  tokenStorage: {
    clearAll: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateResetTokenMock.mockResolvedValue({ valid: true });
    logoutMock.mockResolvedValue(undefined);
  });

  it('shows backend detail message in submit error modal with retry action', async () => {
    resetPasswordMock.mockRejectedValue(
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
        path: '/api/auth/reset-password',
        traceId: null,
      }),
    );

    render(
      <MemoryRouter initialEntries={['/reset-password?token=test-token']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await screen.findByText('Set a new password');

    await user.type(screen.getByLabelText('New Password'), 'my dog loves eating pizza');
    await user.type(screen.getByLabelText('Confirm New Password'), 'my dog loves eating pizza');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('Reset failed')).toBeInTheDocument();
    expect(
      screen.getByText('New password must be different from current password.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.queryByText('Reset failed')).not.toBeInTheDocument();
    });
  });

  it('navigates to login from success modal', async () => {
    resetPasswordMock.mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/reset-password?token=test-token']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await screen.findByText('Set a new password');

    await user.type(screen.getByLabelText('New Password'), 'my dog loves eating pizza');
    await user.type(screen.getByLabelText('Confirm New Password'), 'my dog loves eating pizza');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('Password updated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});
