import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { RegisterConfig } from '../types';
import { ApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { useRegisterConfig } from './useRegisterConfig';
import { authApi } from '../api/authApi';

vi.mock('../api/authApi', () => ({
  authApi: {
    getRegisterConfig: vi.fn(),
  },
}));

describe('useRegisterConfig', () => {
  const mockConfig: RegisterConfig = {
    domainRestrictionEnabled: false,
    studentDomain: null,
    supervisorDomain: null,
    studentEmailPrefixRestrictionEnabled: false,
    studentEmailPrefixRegex: null,
  };

  const dummyError: ApiError = {
    code: 'ERROR',
    message: 'Test Error',
    details: [],
    timestamp: '2023-01-01T00:00:00Z',
    status: 400,
    error: 'Bad Request',
    path: '/api/auth/register/config',
    traceId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reload() sets loading and returns config on success', async () => {
    (authApi.getRegisterConfig as Mock).mockResolvedValue(mockConfig);

    const { result } = renderHook(() =>
      useRegisterConfig({ autoLoad: false, fallbackMessage: 'fallback' }),
    );

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.config).toEqual(mockConfig);
  });

  it('surfaces ApiException apiError', async () => {
    (authApi.getRegisterConfig as Mock).mockRejectedValue(new ApiException(dummyError));

    const { result } = renderHook(() =>
      useRegisterConfig({ autoLoad: false, fallbackMessage: 'fallback' }),
    );

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.config).toBeNull();
    expect(result.current.error).toEqual(dummyError);
  });

  it('maps unknown error to fallback ApiError', async () => {
    (authApi.getRegisterConfig as Mock).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() =>
      useRegisterConfig({ autoLoad: false, fallbackMessage: 'fallback message' }),
    );

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.config).toBeNull();
    expect(result.current.error?.status).toBe(503);
    expect(result.current.error?.message).toBe('fallback message');
    expect(result.current.error?.path).toBe('/api/auth/register/config');
  });
});
