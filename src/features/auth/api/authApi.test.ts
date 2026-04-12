import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('../../../services/apiClient', () => ({
  apiClient: apiClientMock,
}));

async function loadAuthApi() {
  const module = await import('./authApi');
  return module.authApi;
}

describe('authApi.registerSupervisor', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('posts to /api/auth/register/supervisor with the provided payload', async () => {
    const authApi = await loadAuthApi();
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@sliit.lk',
      password: 'Test@1234',
    };

    vi.mocked(apiClientMock.post).mockResolvedValue({
      id: 'user-id',
      email: 'jane.doe@sliit.lk',
      firstName: 'Jane',
      lastName: 'Doe',
      registrationNumber: null,
      role: 'SUPERVISOR',
    });

    await authApi.registerSupervisor(payload);

    expect(apiClientMock.post).toHaveBeenCalledWith('/api/auth/register/supervisor', payload);
  });

  it('returns the backend RegisterResponse payload', async () => {
    const authApi = await loadAuthApi();
    const response = {
      id: 'user-id',
      email: 'jane.doe@sliit.lk',
      firstName: 'Jane',
      lastName: 'Doe',
      registrationNumber: null,
      role: 'SUPERVISOR',
    } as const;

    vi.mocked(apiClientMock.post).mockResolvedValue(response);

    const result = await authApi.registerSupervisor({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@sliit.lk',
      password: 'Test@1234',
    });

    expect(result).toEqual(response);
  });

  it('rejects when registration config request fails', async () => {
    const authApi = await loadAuthApi();
    vi.mocked(apiClientMock.get).mockRejectedValueOnce(new Error('network error'));

    await expect(authApi.getRegisterConfig()).rejects.toThrow('network error');
  });

  it('fetches registration config with prefix metadata', async () => {
    const authApi = await loadAuthApi();
    vi.mocked(apiClientMock.get).mockResolvedValue({
      domainRestrictionEnabled: true,
      studentDomain: '@my.sliit.lk',
      supervisorDomain: '@gmail.com',
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: '^IT(1[5-9]|[2-4][0-9]|50)\\d{6}$',
    });

    const result = await authApi.getRegisterConfig();

    expect(apiClientMock.get).toHaveBeenCalledWith('/api/auth/register/config');
    expect(result).toEqual({
      domainRestrictionEnabled: true,
      studentDomain: '@my.sliit.lk',
      supervisorDomain: '@gmail.com',
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: '^IT(1[5-9]|[2-4][0-9]|50)\\d{6}$',
    });
  });

  it('deduplicates concurrent register config requests', async () => {
    const authApi = await loadAuthApi();
    const registerConfig = {
      domainRestrictionEnabled: true,
      studentDomain: '@my.sliit.lk',
      supervisorDomain: '@gmail.com',
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: '^IT',
    };

    let resolveConfig: ((value: typeof registerConfig) => void) | null = null;
    vi.mocked(apiClientMock.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConfig = resolve;
        }),
    );

    const first = authApi.getRegisterConfig();
    const second = authApi.getRegisterConfig();

    expect(apiClientMock.get).toHaveBeenCalledTimes(1);

    resolveConfig?.(registerConfig);

    await expect(first).resolves.toEqual(registerConfig);
    await expect(second).resolves.toEqual(registerConfig);
  });

  it('reuses cached register config after first successful fetch', async () => {
    const authApi = await loadAuthApi();
    const registerConfig = {
      domainRestrictionEnabled: true,
      studentDomain: '@my.sliit.lk',
      supervisorDomain: '@gmail.com',
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: '^IT',
    };

    vi.mocked(apiClientMock.get).mockResolvedValue(registerConfig);

    const first = await authApi.getRegisterConfig();
    const second = await authApi.getRegisterConfig();

    expect(first).toEqual(registerConfig);
    expect(second).toEqual(registerConfig);
    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
  });

  it('clears cache on failure so subsequent retry performs a new request', async () => {
    const authApi = await loadAuthApi();
    const registerConfig = {
      domainRestrictionEnabled: true,
      studentDomain: '@my.sliit.lk',
      supervisorDomain: '@gmail.com',
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: '^IT',
    };

    vi.mocked(apiClientMock.get)
      .mockRejectedValueOnce(new Error('transient failure'))
      .mockResolvedValueOnce(registerConfig);

    await expect(authApi.getRegisterConfig()).rejects.toThrow('transient failure');
    await expect(authApi.getRegisterConfig()).resolves.toEqual(registerConfig);

    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
  });
});
