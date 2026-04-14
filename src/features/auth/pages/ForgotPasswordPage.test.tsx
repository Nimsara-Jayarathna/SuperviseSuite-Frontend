import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ForgotPasswordPage } from './ForgotPasswordPage';

const { getRegisterConfigMock } = vi.hoisted(() => ({
  getRegisterConfigMock: vi.fn(),
}));

vi.mock('@/features/auth/api/authApi', () => ({
  authApi: {
    getRegisterConfig: getRegisterConfigMock,
    forgotPassword: vi.fn(),
  },
}));

vi.mock('@/features/landing', () => ({
  LandingPage: () => <div>landing</div>,
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows blocking error modal when register config fetch fails', async () => {
    getRegisterConfigMock.mockRejectedValue(new Error('network failure'));

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Service temporarily unavailable')).toBeInTheDocument();

    await waitFor(() => {
      expect(getRegisterConfigMock).toHaveBeenCalledTimes(1);
    });
  });
});
