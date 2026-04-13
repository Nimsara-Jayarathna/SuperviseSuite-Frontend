import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/apiClient', () => ({
  isApiException: (value: unknown) => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'apiError' in value &&
      'name' in value &&
      (value as { name?: string }).name === 'ApiException'
    );
  },
}));

vi.mock('../api/authApi', () => ({
  authApi: {
    registerInit: vi.fn(),
    registerVerify: vi.fn(),
    registerComplete: vi.fn(),
  },
}));

import { authApi } from '../api/authApi';
import { useRegistrationFlow } from './useRegistrationFlow';

describe('useRegistrationFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('starts with empty email even when sessionStorage has stale value', () => {
    sessionStorage.setItem('reg_email', 'stale@example.com');

    const { result } = renderHook(() => useRegistrationFlow());

    expect(result.current.email).toBe('');
    expect(result.current.step).toBe('email');
  });

  it('submitEmail advances to otp without writing sessionStorage', async () => {
    vi.mocked(authApi.registerInit).mockResolvedValue({ message: 'ok' });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { result } = renderHook(() => useRegistrationFlow());

    await act(async () => {
      await result.current.submitEmail('user@example.com');
    });

    expect(result.current.step).toBe('otp');
    expect(result.current.email).toBe('user@example.com');
    expect(setSpy.mock.calls.some((call) => call[0] === 'reg_email')).toBe(false);
  });

  it('dismiss clears in-memory registration state', async () => {
    vi.mocked(authApi.registerInit).mockResolvedValue({ message: 'ok' });

    const { result } = renderHook(() => useRegistrationFlow());

    await act(async () => {
      await result.current.submitEmail('user@example.com');
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.step).toBe('email');
    expect(result.current.email).toBe('');
    expect(result.current.registrationToken).toBe('');
    expect(result.current.inferredRole).toBeNull();
    expect(result.current.selectedRole).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  it('successful complete flow does not remove sessionStorage key', async () => {
    vi.mocked(authApi.registerInit).mockResolvedValue({ message: 'ok' });
    vi.mocked(authApi.registerVerify).mockResolvedValue({
      registrationToken: 'token_abc',
      requiresRoleSelection: false,
      role: 'STUDENT',
    });
    vi.mocked(authApi.registerComplete).mockResolvedValue({
      user: {
        id: '1',
        email: 'user@example.com',
        role: 'STUDENT',
        firstName: 'Nimal',
        lastName: 'Perera',
      },
    });

    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
    const { result } = renderHook(() => useRegistrationFlow());

    await act(async () => {
      await result.current.submitEmail('user@example.com');
    });
    await act(async () => {
      await result.current.submitOtp('123456');
    });
    await act(async () => {
      await result.current.submitProfile({
        firstName: 'Nimal',
        lastName: 'Perera',
        password: 'Secure@123',
        registrationNumber: 'IT24103464',
      });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(removeSpy.mock.calls.some((call) => call[0] === 'reg_email')).toBe(false);
  });

  it('routes to role step when verify requires role selection', async () => {
    vi.mocked(authApi.registerInit).mockResolvedValue({ message: 'ok' });
    vi.mocked(authApi.registerVerify).mockResolvedValue({
      registrationToken: 'token_role',
      requiresRoleSelection: true,
      role: null,
    });

    const { result } = renderHook(() => useRegistrationFlow());

    await act(async () => {
      await result.current.submitEmail('person@gmail.com');
    });

    await act(async () => {
      await result.current.submitOtp('123456');
    });

    expect(result.current.step).toBe('role');
    expect(result.current.registrationToken).toBe('token_role');
  });

  it('submitOtp sets api error when verification fails', async () => {
    vi.mocked(authApi.registerVerify).mockRejectedValue({
      apiError: {
        code: 'BAD_REQUEST',
        message: 'Invalid or expired OTP.',
        details: [],
        timestamp: '2026-04-12T00:00:00Z',
        status: 400,
        error: 'Bad Request',
        path: '/api/auth/register/verify',
        traceId: null,
      },
      name: 'ApiException',
      status: 400,
    });

    const { result } = renderHook(() => useRegistrationFlow());

    await act(async () => {
      await result.current.submitOtp('123456');
    });

    expect(result.current.error?.message).toBe('Invalid or expired OTP.');
    expect(result.current.isLoading).toBe(false);
  });

  it('goBack from profile returns to role for non-sliit emails', async () => {
    vi.mocked(authApi.registerInit).mockResolvedValue({ message: 'ok' });
    vi.mocked(authApi.registerVerify).mockResolvedValue({
      registrationToken: 'token_role',
      requiresRoleSelection: true,
      role: null,
    });

    const { result } = renderHook(() => useRegistrationFlow());

    await act(async () => {
      await result.current.submitEmail('person@gmail.com');
    });

    await act(async () => {
      await result.current.submitOtp('123456');
    });

    act(() => {
      result.current.selectRole('SUPERVISOR');
    });

    expect(result.current.step).toBe('profile');

    act(() => {
      result.current.goBack();
    });

    expect(result.current.step).toBe('role');
  });
});
