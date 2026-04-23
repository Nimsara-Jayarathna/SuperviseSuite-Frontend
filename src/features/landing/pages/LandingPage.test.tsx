import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ReactNode } from 'react';
import { LandingPage } from './LandingPage';

const { getRegisterConfigMock } = vi.hoisted(() => ({
  getRegisterConfigMock: vi.fn(),
}));

vi.mock('@/features/auth/api/authApi', () => ({
  authApi: {
    getRegisterConfig: getRegisterConfigMock,
  },
}));

vi.mock('@/app/layout/PublicLayout', () => ({
  PublicLayout: ({ onRegister, children }: { onRegister: () => void; children: ReactNode }) => (
    <div>
      <button type="button" onClick={onRegister}>
        Open register
      </button>
      {children}
    </div>
  ),
}));

vi.mock('@/features/auth/components/LoginPanel', () => ({
  LoginPanel: () => null,
}));

vi.mock('@/features/auth/components/registration/RegistrationPanel', () => ({
  RegistrationPanel: () => <div>registration-panel</div>,
}));

vi.mock('../components/HeroSection', () => ({ HeroSection: () => null }));
vi.mock('../components/FeaturesSection', () => ({ FeaturesSection: () => null }));
vi.mock('../components/HowItWorksSection', () => ({ HowItWorksSection: () => null }));
vi.mock('../components/WhoItsForSection', () => ({ WhoItsForSection: () => null }));

describe('LandingPage registration gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens registration when config fetch succeeds', async () => {
    const user = userEvent.setup();
    getRegisterConfigMock.mockResolvedValue({
      domainRestrictionEnabled: true,
      studentDomain: '@my.sliit.lk',
      supervisorDomain: '@sliit.lk',
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: '^IT',
    });

    render(<LandingPage />);

    await user.click(screen.getByRole('button', { name: 'Open register' }));

    expect(await screen.findByText('registration-panel')).toBeInTheDocument();
  });

  it('does not open registration and shows blocking error when config fetch fails', async () => {
    const user = userEvent.setup();
    getRegisterConfigMock.mockRejectedValue(new Error('network failure'));

    render(<LandingPage />);

    await user.click(screen.getByRole('button', { name: 'Open register' }));

    expect(await screen.findByText('Service temporarily unavailable')).toBeInTheDocument();
    expect(screen.queryByText('registration-panel')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getRegisterConfigMock).toHaveBeenCalledTimes(1);
    });
  });
});
