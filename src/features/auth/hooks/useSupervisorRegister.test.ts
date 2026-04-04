import { vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { authApi } from '@/features/auth/api/authApi';
import { ApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { useSupervisorRegister } from './useSupervisorRegister';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/features/auth/api/authApi', () => ({
  authApi: { registerSupervisor: vi.fn() },
}));

const validPayload = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@sliit.lk',
  password: 'Test@1234',
};

function makeApiError(overrides: Partial<ApiError> = {}): ApiError {
  return {
    timestamp: '2026-03-04T00:00:00Z',
    status: 500,
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
    path: '/api/auth/register/supervisor',
    traceId: null,
    details: [],
    ...overrides,
  };
}

describe('useSupervisorRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls authApi.registerSupervisor with payload and navigates to /login on success', async () => {
    vi.mocked(authApi.registerSupervisor).mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useSupervisorRegister());

    await act(async () => {
      await result.current.register(validPayload);
    });

    expect(authApi.registerSupervisor).toHaveBeenCalledWith(validPayload);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(result.current.error).toBeNull();
  });

  it('maps ApiException error from backend (e.g. VALIDATION_ERROR on email)', async () => {
    const validationError = makeApiError({
      status: 400,
      error: 'Bad Request',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed.',
      details: [{ field: 'email', message: 'Email must be a valid SLIIT institutional email (@sliit.lk).' }],
    });

    vi.mocked(authApi.registerSupervisor).mockRejectedValue(new ApiException(validationError));

    const { result } = renderHook(() => useSupervisorRegister());

    await act(async () => {
      await result.current.register(validPayload);
    });

    expect(result.current.error).toEqual(validationError);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('maps duplicate-email conflict from backend', async () => {
    const conflictError = makeApiError({
      status: 409,
      error: 'Conflict',
      code: 'CONFLICT',
      message: 'An account with this email already exists.',
    });

    vi.mocked(authApi.registerSupervisor).mockRejectedValue(new ApiException(conflictError));

    const { result } = renderHook(() => useSupervisorRegister());

    await act(async () => {
      await result.current.register(validPayload);
    });

    expect(result.current.error?.code).toBe('CONFLICT');
    expect(result.current.error?.message).toBe('An account with this email already exists.');
  });
});
