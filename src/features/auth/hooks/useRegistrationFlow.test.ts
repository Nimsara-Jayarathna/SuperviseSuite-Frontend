import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
});
