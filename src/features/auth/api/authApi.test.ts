import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { authApi } from './authApi';
import { apiClient } from '../../../services/apiClient';

describe('authApi.registerSupervisor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /api/auth/register/supervisor with the provided payload', async () => {
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@sliit.lk',
      password: 'Test@1234',
    };

    vi.mocked(apiClient.post).mockResolvedValue({
      id: 'user-id',
      email: 'jane.doe@sliit.lk',
      firstName: 'Jane',
      lastName: 'Doe',
      registrationNumber: null,
      role: 'SUPERVISOR',
    });

    await authApi.registerSupervisor(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register/supervisor', payload);
  });

  it('returns the backend RegisterResponse payload', async () => {
    const response = {
      id: 'user-id',
      email: 'jane.doe@sliit.lk',
      firstName: 'Jane',
      lastName: 'Doe',
      registrationNumber: null,
      role: 'SUPERVISOR',
    } as const;

    vi.mocked(apiClient.post).mockResolvedValue(response);

    const result = await authApi.registerSupervisor({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@sliit.lk',
      password: 'Test@1234',
    });

    expect(result).toEqual(response);
  });

  it('falls back to open registration config when config request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network error'));

    const result = await authApi.getRegisterConfig();

    expect(result).toEqual({
      domainRestrictionEnabled: false,
      studentDomain: null,
      supervisorDomain: null,
      studentEmailPrefixRestrictionEnabled: false,
      studentEmailPrefixRegex: null,
    });
  });

  it('fetches registration config with prefix metadata', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      domainRestrictionEnabled: true,
      studentDomain: '@my.sliit.lk',
      supervisorDomain: '@gmail.com',
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: '^IT(1[5-9]|[2-4][0-9]|50)\\d{6}$',
    });

    const result = await authApi.getRegisterConfig();

    expect(apiClient.get).toHaveBeenCalledWith('/api/auth/register/config');
    expect(result).toEqual({
      domainRestrictionEnabled: true,
      studentDomain: '@my.sliit.lk',
      supervisorDomain: '@gmail.com',
      studentEmailPrefixRestrictionEnabled: true,
      studentEmailPrefixRegex: '^IT(1[5-9]|[2-4][0-9]|50)\\d{6}$',
    });
  });
});
