import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import type { RegisterConfig } from '../../types';
import { Step4ProfileDetails } from './Step4ProfileDetails';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

function createFlow(overrides: Partial<RegistrationFlow> = {}): RegistrationFlow {
  return {
    step: 'profile',
    email: 'it24103464@my.sliit.lk',
    registrationToken: 'token_abc',
    inferredRole: 'STUDENT',
    selectedRole: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    effectiveRole: 'STUDENT',
    isSliitEmail: true,
    shouldSkipRoleStep: true,
    clearError: vi.fn(),
    submitEmail: vi.fn(),
    submitOtp: vi.fn(),
    selectRole: vi.fn(),
    submitProfile: vi.fn().mockResolvedValue(undefined),
    resendOtp: vi.fn(),
    goBack: vi.fn(),
    dismiss: vi.fn(),
    ...overrides,
  } as unknown as RegistrationFlow;
}

function createConfig(overrides: Partial<RegisterConfig> = {}): RegisterConfig {
  return {
    domainRestrictionEnabled: true,
    studentDomain: '@my.sliit.lk',
    supervisorDomain: '@sliit.lk',
    studentEmailPrefixRestrictionEnabled: true,
    studentEmailPrefixRegex: '^IT(1[5-9]|[2-4][0-9]|50)[0-9]{6}$',
    ...overrides,
  };
}

describe('Step4ProfileDetails', () => {
  it('auto-fills registration number from student email local-part and locks the field', async () => {
    render(<Step4ProfileDetails flow={createFlow()} config={createConfig()} />);

    const input = screen.getByLabelText('Registration Number') as HTMLInputElement;

    await waitFor(() => {
      expect(input.value).toBe('IT24103464');
    });
    expect(input).toBeDisabled();
  });

  it('keeps registration number editable when domain restriction is disabled', async () => {
    render(
      <Step4ProfileDetails
        flow={createFlow()}
        config={createConfig({ domainRestrictionEnabled: false })}
      />,
    );

    const input = screen.getByLabelText('Registration Number') as HTMLInputElement;

    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
  });

  it('keeps registration number editable when prefix restriction is disabled', async () => {
    render(
      <Step4ProfileDetails
        flow={createFlow()}
        config={createConfig({ studentEmailPrefixRestrictionEnabled: false })}
      />,
    );

    const input = screen.getByLabelText('Registration Number') as HTMLInputElement;

    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
  });

  it('submits the auto-filled registration number in locked mode', async () => {
    const user = userEvent.setup();
    const submitProfile = vi.fn().mockResolvedValue(undefined);
    const flow = createFlow({ submitProfile });

    render(<Step4ProfileDetails flow={flow} config={createConfig()} />);

    await user.type(screen.getByLabelText('First name'), 'Nimal');
    await user.type(screen.getByLabelText('Last name'), 'Perera');
    await user.type(screen.getByLabelText('Password'), 'Secure@123');
    await user.type(screen.getByLabelText('Confirm password'), 'Secure@123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(submitProfile).toHaveBeenCalledWith({
        firstName: 'Nimal',
        lastName: 'Perera',
        password: 'Secure@123',
        registrationNumber: 'IT24103464',
      });
    });
  });
});
