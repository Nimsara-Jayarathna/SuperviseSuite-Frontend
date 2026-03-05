import { vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { authApi } from '@/features/auth/api/authApi';
import { ApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';
import { useRegister } from './useRegister';

// ---------------------------------------------------------------------------
// Module mocks
// vi.hoisted ensures mockNavigate is available inside the vi.mock factory
// even though vi.mock calls are hoisted above import statements.
// ---------------------------------------------------------------------------

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/features/auth/api/authApi', () => ({
  authApi: { register: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validPayload = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  password: 'Secure@123',
  registrationNumber: 'IT24100400',
};

function makeApiError(overrides: Partial<ApiError> = {}): ApiError {
  return {
    timestamp: '2026-03-04T00:00:00Z',
    status: 500,
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
    path: '/api/auth/register',
    traceId: null,
    details: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts with isLoading=false and error=null', () => {
    const { result } = renderHook(() => useRegister());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Successful registration
  // -------------------------------------------------------------------------

  describe('register — success', () => {
    beforeEach(() => {
      // useRegister ignores the resolved value — any resolved value is fine.
      vi.mocked(authApi.register).mockResolvedValue(undefined as never);
    });

    it('calls authApi.register with the exact submitted payload', async () => {
      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      expect(vi.mocked(authApi.register)).toHaveBeenCalledOnce();
      expect(vi.mocked(authApi.register)).toHaveBeenCalledWith(validPayload);
    });

    it('the payload does not include a role field — backend assigns STUDENT', async () => {
      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      const calledWith = vi.mocked(authApi.register).mock.calls[0][0];
      expect(calledWith).not.toHaveProperty('role');
    });

    it('navigates to /login after success (no auto-login)', async () => {
      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      expect(mockNavigate).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('leaves isLoading=false and error=null after success', async () => {
      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // ApiException (known backend error — e.g. duplicate email / validation)
  // -------------------------------------------------------------------------

  describe('register — ApiException', () => {
    it('sets error to the ApiError payload from the exception', async () => {
      const conflictError = makeApiError({
        status: 409,
        error: 'Conflict',
        code: 'CONFLICT',
        message: 'An account with this email already exists.',
      });

      vi.mocked(authApi.register).mockRejectedValue(new ApiException(conflictError));

      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      expect(result.current.error).toEqual(conflictError);
      expect(result.current.isLoading).toBe(false);
    });

    it('sets error for a backend VALIDATION_ERROR response', async () => {
      const validationError = makeApiError({
        status: 400,
        error: 'Bad Request',
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        details: [{ field: 'email', message: 'Enter a valid email.' }],
      });

      vi.mocked(authApi.register).mockRejectedValue(new ApiException(validationError));

      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      expect(result.current.error?.code).toBe('VALIDATION_ERROR');
      expect(result.current.error?.details).toHaveLength(1);
    });

    it('does not navigate to /login when registration fails', async () => {
      vi.mocked(authApi.register).mockRejectedValue(
        new ApiException(makeApiError({ code: 'CONFLICT' })),
      );

      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Unexpected / network error (non-ApiException)
  // -------------------------------------------------------------------------

  describe('register — unexpected error', () => {
    it('sets a generic INTERNAL_ERROR for non-ApiException errors', async () => {
      vi.mocked(authApi.register).mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      expect(result.current.error?.code).toBe('INTERNAL_ERROR');
      expect(result.current.error?.message).toBe('Something went wrong. Please try again.');
      expect(result.current.isLoading).toBe(false);
    });

    it('does not navigate on unexpected error', async () => {
      vi.mocked(authApi.register).mockRejectedValue(new TypeError('Failed to fetch'));

      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // clearError
  // -------------------------------------------------------------------------

  describe('clearError', () => {
    it('resets error to null', async () => {
      vi.mocked(authApi.register).mockRejectedValue(
        new ApiException(makeApiError({ code: 'CONFLICT' })),
      );

      const { result } = renderHook(() => useRegister());

      await act(async () => {
        await result.current.register(validPayload);
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('leaves isLoading unchanged when clearing error', async () => {
      const { result } = renderHook(() => useRegister());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
