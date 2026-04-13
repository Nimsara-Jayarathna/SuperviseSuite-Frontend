import { describe, expect, it } from 'vitest';
import { mapBackendResetPasswordFieldErrors } from './resetPasswordValidation';
import type { ApiError } from '@/types';

describe('mapBackendResetPasswordFieldErrors', () => {
  it('maps newPassword issue from API details', () => {
    const apiError: ApiError = {
      code: 'VALIDATION_ERROR',
      status: 400,
      message: 'Validation failed.',
      details: [
        {
          field: 'newPassword',
          issue: 'New password must be different from current password.',
        },
      ],
      timestamp: '2026-04-14T00:00:00Z',
      path: '/api/auth/reset-password',
      traceId: null,
    };

    expect(mapBackendResetPasswordFieldErrors(apiError)).toEqual({
      newPassword: 'New password must be different from current password.',
    });
  });

  it('returns empty map for non-reset fields', () => {
    const apiError: ApiError = {
      code: 'VALIDATION_ERROR',
      status: 400,
      message: 'Validation failed.',
      details: [{ field: 'email', issue: 'Email is invalid.' }],
      timestamp: '2026-04-14T00:00:00Z',
      path: '/api/auth/reset-password',
      traceId: null,
    };

    expect(mapBackendResetPasswordFieldErrors(apiError)).toEqual({});
  });
});
