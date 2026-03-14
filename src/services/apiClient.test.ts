import { beforeEach, describe, expect, it, vi } from 'vitest';

const setUser = vi.hoisted(() => vi.fn());
const clearAll = vi.hoisted(() => vi.fn());

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

import { ApiException, apiClient } from '@/services/apiClient';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiClient 401 handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('does not attempt refresh for failed /api/auth/login and surfaces backend message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(401, {
        timestamp: '2026-03-14T10:00:00Z',
        status: 401,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
        path: '/api/auth/login',
        traceId: null,
        details: [],
      }),
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

  it('still attempts refresh for protected endpoint 401 and retries original request', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(401, {
          timestamp: '2026-03-14T10:00:00Z',
          status: 401,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          path: '/api/supervisor/projects',
          traceId: null,
          details: [],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          message: 'Token refreshed.',
          data: {
            user: {
              id: 'u-1',
              email: 'user@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: 'SUPERVISOR',
            },
          },
          error: null,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          message: 'OK',
          data: { ok: true },
          error: null,
        }),
      );

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

  it('does not recursively refresh when /api/auth/refresh itself returns 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(401, {
        timestamp: '2026-03-14T10:00:00Z',
        status: 401,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
        message: 'Refresh token is invalid or has expired.',
        path: '/api/auth/refresh',
        traceId: null,
        details: [],
      }),
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
