import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';
import { apiClient } from '@/services/apiClient';

// TODO: set to false once backend /api/auth/* endpoints are live
const USE_MOCK = true;

const MOCK_DELAY = 600; // ms — simulates network latency

const mockDelay = () => new Promise((res) => setTimeout(res, MOCK_DELAY));

const MOCK_RESPONSE: AuthResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: {
    id: 'mock-user-id',
    email: 'demo@supervisesuite.com',
    role: 'STUDENT',
    firstName: 'Demo',
    lastName: 'User',
    isEmailVerified: true,
  },
};

export const authApi = {
  async login(body: LoginRequest): Promise<AuthResponse> {
    if (USE_MOCK) {
      await mockDelay();
      return { ...MOCK_RESPONSE, user: { ...MOCK_RESPONSE.user, email: body.email } };
    }
    return apiClient.post<AuthResponse>('/api/auth/login', body);
  },

  async register(body: RegisterRequest): Promise<AuthResponse> {
    if (USE_MOCK) {
      await mockDelay();
      return {
        ...MOCK_RESPONSE,
        user: {
          ...MOCK_RESPONSE.user,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          role: body.role,
        },
      };
    }
    return apiClient.post<AuthResponse>('/api/auth/register', body);
  },
};
