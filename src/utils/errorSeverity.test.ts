import type { ApiError } from '@/types';
import { getBlockingErrorTitle, isBlockingError } from './errorSeverity';

function makeApiError(overrides: Partial<ApiError> = {}): ApiError {
  return {
    timestamp: '2026-04-12T00:00:00Z',
    status: 400,
    error: 'Bad Request',
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    path: '/api/test',
    traceId: null,
    details: [],
    ...overrides,
  };
}

describe('isBlockingError', () => {
  it('returns true for TOO_MANY_REQUESTS', () => {
    expect(isBlockingError(makeApiError({ code: 'TOO_MANY_REQUESTS', status: 429 }))).toBe(true);
  });

  it('returns true for SERVICE_UNAVAILABLE', () => {
    expect(isBlockingError(makeApiError({ code: 'SERVICE_UNAVAILABLE', status: 503 }))).toBe(true);
  });

  it('returns false for validation errors', () => {
    expect(isBlockingError(makeApiError())).toBe(false);
  });
});

describe('getBlockingErrorTitle', () => {
  it('returns too many requests title for 429', () => {
    expect(getBlockingErrorTitle(makeApiError({ status: 429 }))).toBe('Too many requests');
  });

  it('returns service unavailable title for 503', () => {
    expect(getBlockingErrorTitle(makeApiError({ status: 503 }))).toBe(
      'Service temporarily unavailable',
    );
  });
});
