import type { ApiError } from '@/types';
import { getBlockingAuthErrorTitle, isBlockingAuthError } from './authErrorModel';

function makeApiError(overrides: Partial<ApiError> = {}): ApiError {
  return {
    timestamp: '2026-04-12T00:00:00Z',
    status: 400,
    error: 'Bad Request',
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    path: '/api/auth/login',
    traceId: null,
    details: [],
    ...overrides,
  };
}

describe('isBlockingAuthError', () => {
  it('returns true for TOO_MANY_REQUESTS code', () => {
    expect(isBlockingAuthError(makeApiError({ code: 'TOO_MANY_REQUESTS', status: 429 }))).toBe(
      true,
    );
  });

  it('returns true for SERVICE_UNAVAILABLE code', () => {
    expect(isBlockingAuthError(makeApiError({ code: 'SERVICE_UNAVAILABLE', status: 503 }))).toBe(
      true,
    );
  });

  it('returns true for 429 status even if code differs', () => {
    expect(isBlockingAuthError(makeApiError({ code: 'BAD_REQUEST', status: 429 }))).toBe(true);
  });

  it('returns false for validation errors', () => {
    expect(isBlockingAuthError(makeApiError({ code: 'VALIDATION_ERROR', status: 400 }))).toBe(
      false,
    );
  });
});

describe('getBlockingAuthErrorTitle', () => {
  it('returns rate-limit title for 429', () => {
    expect(
      getBlockingAuthErrorTitle(makeApiError({ code: 'TOO_MANY_REQUESTS', status: 429 })),
    ).toBe('Too many requests');
  });

  it('returns service title for 503', () => {
    expect(
      getBlockingAuthErrorTitle(makeApiError({ code: 'SERVICE_UNAVAILABLE', status: 503 })),
    ).toBe('Service temporarily unavailable');
  });

  it('returns fallback title for null error', () => {
    expect(getBlockingAuthErrorTitle(null)).toBe('Request failed');
  });
});
