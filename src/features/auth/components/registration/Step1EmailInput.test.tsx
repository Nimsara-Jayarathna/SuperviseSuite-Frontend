import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ApiError } from '@/types';
import type { RegisterConfig } from '../../types';
import type { useRegistrationFlow } from '../../hooks/useRegistrationFlow';
import { Step1EmailInput } from './Step1EmailInput';

type RegistrationFlow = ReturnType<typeof useRegistrationFlow>;

function createFlow(): RegistrationFlow {
  return {
    step: 'email',
    email: '',
    registrationToken: '',
    inferredRole: null,
    selectedRole: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    submitEmail: vi.fn(),
    submitOtp: vi.fn(),
    selectRole: vi.fn(),
    submitProfile: vi.fn(),
    resendOtp: vi.fn(),
    goBack: vi.fn(),
    dismiss: vi.fn(),
    clearError: vi.fn(),
  } as unknown as RegistrationFlow;
}

function baseConfig(): RegisterConfig {
  return {
    domainRestrictionEnabled: true,
    studentDomain: '@my.sliit.lk',
    supervisorDomain: '@sliit.lk',
    studentEmailPrefixRestrictionEnabled: true,
    studentEmailPrefixRegex: '^IT(1[5-9]|[2-4][0-9]|50)\\d{6}$',
  };
}

function makeApiError(overrides: Partial<ApiError> = {}): ApiError {
  return {
    timestamp: '2026-04-12T00:00:00Z',
    status: 400,
    error: 'Bad Request',
    code: 'VALIDATION_ERROR',
    message: 'Validation failed.',
    path: '/api/auth/register/init',
    traceId: null,
    details: [],
    ...overrides,
  };
}

describe('Step1EmailInput', () => {
  it('blocks continue for invalid student prefix when restriction is enabled', async () => {
    const user = userEvent.setup();
    render(<Step1EmailInput flow={createFlow()} config={baseConfig()} />);

    await user.type(screen.getByLabelText('Email'), 'xx24123456@my.sliit.lk');

    expect(screen.getByText('Invalid IT number format. Use ITXXXXXXXX.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('allows continue for valid student prefix when restriction is enabled', async () => {
    const user = userEvent.setup();
    render(<Step1EmailInput flow={createFlow()} config={baseConfig()} />);

    await user.type(screen.getByLabelText('Email'), 'it24123456@my.sliit.lk');

    expect(screen.queryByText(/Invalid IT number format/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('bypasses prefix restriction when domain restriction is disabled', async () => {
    const user = userEvent.setup();
    const config = { ...baseConfig(), domainRestrictionEnabled: false };
    render(<Step1EmailInput flow={createFlow()} config={config} />);

    await user.type(screen.getByLabelText('Email'), 'xx14123456@gmail.com');

    expect(screen.queryByText(/Invalid IT number format/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('does not render blocking errors inline', () => {
    const flow = createFlow();
    flow.error = makeApiError({
      code: 'TOO_MANY_REQUESTS',
      status: 429,
      message: 'Too many requests. Please try again later.',
    });

    render(<Step1EmailInput flow={flow} config={baseConfig()} />);

    expect(
      screen.queryByText('Too many requests. Please try again later.'),
    ).not.toBeInTheDocument();
  });
});
