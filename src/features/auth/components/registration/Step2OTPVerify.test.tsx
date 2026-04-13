import { act, render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Step2OTPVerify } from './Step2OTPVerify';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

function makeFlow(overrides: Partial<RegistrationFlow> = {}): RegistrationFlow {
  return {
    step: 'otp',
    email: 'user@example.com',
    registrationToken: '',
    inferredRole: null,
    selectedRole: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    effectiveRole: null,
    isSliitEmail: false,
    shouldSkipRoleStep: false,
    clearError: vi.fn(),
    submitEmail: vi.fn(),
    submitOtp: vi.fn().mockResolvedValue(undefined),
    selectRole: vi.fn(),
    submitProfile: vi.fn(),
    resendOtp: vi.fn().mockResolvedValue(undefined),
    goBack: vi.fn(),
    dismiss: vi.fn(),
    ...overrides,
  } as RegistrationFlow;
}

describe('Step2OTPVerify', () => {
  it('auto-submits OTP once 6 digits are entered', async () => {
    const user = userEvent.setup();
    const flow = makeFlow();

    render(<Step2OTPVerify flow={flow} />);

    const inputs = Array.from({ length: 6 }, (_, i) =>
      screen.getByRole('textbox', { name: `OTP digit ${i + 1}` }),
    );

    for (let i = 0; i < inputs.length; i += 1) {
      await user.type(inputs[i], String(i + 1));
    }

    await waitFor(() => {
      expect(flow.submitOtp).toHaveBeenCalledWith('123456');
    });
  });

  it('resend triggers resendOtp and resets inputs', async () => {
    vi.useFakeTimers();
    const flow = makeFlow();

    render(<Step2OTPVerify flow={flow} />);

    act(() => {
      vi.advanceTimersByTime(61000);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Resend code' }));

    // Allow async resend handler to resolve.
    await act(async () => {
      await Promise.resolve();
    });

    expect(flow.resendOtp).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Resend code' })).not.toBeInTheDocument();
    expect(screen.getByText(/Resend code in 0:/)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
