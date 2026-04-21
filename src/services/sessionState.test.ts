import { beforeEach, describe, expect, it, vi } from 'vitest';

const clearInMemoryAuthState = vi.hoisted(() => vi.fn());
const clearSessionCaches = vi.hoisted(() => vi.fn(() => 3));
const clearAll = vi.hoisted(() => vi.fn());
const abortAllInFlightRequests = vi.hoisted(() => vi.fn(() => 2));

vi.mock('@/features/auth/state/authState', () => ({
  clearInMemoryAuthState,
}));

vi.mock('./sessionCache', () => ({
  clearSessionCaches,
}));

vi.mock('./tokenStorage', () => ({
  tokenStorage: {
    clearAll,
  },
}));

vi.mock('./requestRegistry', () => ({
  abortAllInFlightRequests,
}));

describe('sessionState', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('increments session version immediately on transition start', async () => {
    const { beginSessionTransition, getSessionVersion } = await import('./sessionState');

    const previous = getSessionVersion();
    const next = beginSessionTransition('login');

    expect(next).toBe(previous + 1);
    expect(getSessionVersion()).toBe(next);
  });

  it('resets state in deterministic order', async () => {
    const order: string[] = [];

    clearInMemoryAuthState.mockImplementation(() => {
      order.push('auth');
    });
    abortAllInFlightRequests.mockImplementation(() => {
      order.push('abort');
      return 2;
    });
    clearSessionCaches.mockImplementation(() => {
      order.push('cache');
      return 3;
    });
    clearAll.mockImplementation(() => {
      order.push('storage');
    });

    const { resetSessionState } = await import('./sessionState');
    resetSessionState();

    expect(order).toEqual(['auth', 'abort', 'cache', 'storage']);
  });
});
