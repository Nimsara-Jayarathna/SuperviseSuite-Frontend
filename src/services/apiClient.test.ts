import { beforeEach, describe, expect, it, vi } from 'vitest';

const setUser = vi.hoisted(() => vi.fn());
const clearAll = vi.hoisted(() => vi.fn());
const beginSessionTransition = vi.hoisted(() => vi.fn());
const resetSessionState = vi.hoisted(() => vi.fn());

vi.mock('@/app/config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8081' },
}));

vi.mock('@/services/tokenStorage', () => ({
  tokenStorage: {
    getUser: vi.fn(),
    setUser,
    clearUser: vi.fn(),
    clearAll,
  },
}));

vi.mock('@/services/sessionState', () => ({
  beginSessionTransition,
  resetSessionState,
}));

import { ApiException, apiClient } from '@/services/apiClient';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function successEnvelope<T>(data: T, message = 'OK') {
  return {
    success: true,
    message,
    data,
    error: null,
    meta: {
      timestamp: '2026-03-14T10:00:00Z',
      path: '/api/test',
      traceId: null,
    },
  };
}

function errorEnvelope(overrides: {
  message: string;
  code: string;
  status: number;
  details?: Array<{ field: string; issue?: string; message?: string }>;
  path: string;
}) {
  return {
    success: false,
    message: overrides.message,
    data: null,
    error: {
      code: overrides.code,
      status: overrides.status,
      details: overrides.details ?? [],
    },
    meta: {
      timestamp: '2026-03-14T10:00:00Z',
      path: overrides.path,
      traceId: null,
    },
  };
}

describe('apiClient response normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('unwraps wrapped success responses and returns plain data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        200,
        successEnvelope({
          id: 'p-1',
          title: 'Project Phoenix',
        }),
      ),
    );

    const data = await apiClient.get<{ id: string; title: string }>('/api/supervisor/projects/p-1');
    expect(data).toEqual({ id: 'p-1', title: 'Project Phoenix' });
  });

  it('does not attempt refresh for failed /api/auth/login and surfaces backend message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        401,
        errorEnvelope({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
          path: '/api/auth/login',
        }),
      ),
    );

    await expect(
      apiClient.post('/api/auth/login', {
        email: 'wrong@example.com',
        password: 'wrong',
      }),
    ).rejects.toMatchObject<ApiException>({
      apiError: expect.objectContaining({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
      }),
    } as ApiException);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8081/api/auth/login',
      expect.any(Object),
    );
  });

  it('parses wrapped validation errors and keeps field details for forms', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        400,
        errorEnvelope({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          path: '/api/auth/register',
          details: [{ field: 'email', issue: 'Email is invalid.' }],
        }),
      ),
    );

    await expect(
      apiClient.post('/api/auth/register', {
        firstName: 'A',
        lastName: 'B',
        registrationNumber: 'CS/2021/001',
        email: 'bad-email',
        password: 'Secure@123',
      }),
    ).rejects.toMatchObject<ApiException>({
      apiError: expect.objectContaining({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        details: [{ field: 'email', issue: 'Email is invalid.', message: undefined }],
      }),
    } as ApiException);
  });

  it('still attempts refresh for protected endpoint 401 and retries original request', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(
          401,
          errorEnvelope({
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
            path: '/api/supervisor/projects',
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          200,
          successEnvelope(
            {
              user: {
                id: 'u-1',
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'SUPERVISOR',
              },
            },
            'Token refreshed.',
          ),
        ),
      )
      .mockResolvedValueOnce(jsonResponse(200, successEnvelope({ ok: true })));

    const data = await apiClient.get<{ ok: boolean }>('/api/supervisor/projects');
    expect(data).toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8081/api/auth/refresh',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(setUser).toHaveBeenCalledOnce();
  });

  it('clears local auth and throws session-expired error when refresh fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(
          401,
          errorEnvelope({
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
            path: '/api/student/projects',
          }),
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          401,
          errorEnvelope({
            status: 401,
            code: 'UNAUTHORIZED',
            message: 'Refresh token is invalid or has expired.',
            path: '/api/auth/refresh',
          }),
        ),
      );

    await expect(apiClient.get('/api/student/projects')).rejects.toMatchObject<ApiException>({
      apiError: expect.objectContaining({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.',
      }),
    } as ApiException);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(beginSessionTransition).toHaveBeenCalledWith('session-expired');
    expect(resetSessionState).toHaveBeenCalledOnce();
    expect(clearAll).not.toHaveBeenCalled();
  });

  it('does not recursively refresh when /api/auth/refresh itself returns 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        401,
        errorEnvelope({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Refresh token is invalid or has expired.',
          path: '/api/auth/refresh',
        }),
      ),
    );

    await expect(apiClient.post('/api/auth/refresh', {})).rejects.toMatchObject<ApiException>({
      apiError: expect.objectContaining({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Refresh token is invalid or has expired.',
      }),
    } as ApiException);

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
