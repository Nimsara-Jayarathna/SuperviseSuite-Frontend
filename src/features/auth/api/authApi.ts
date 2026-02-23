import type { AuthResponse, LoginRequest, RegisterRequest } from '../types';
import { apiClient } from '@/services/apiClient';

// Switch to false once the backend /api/auth/* endpoints are live.
// Mock credentials must never reach a production build.
const USE_MOCK = true;

const MOCK_DELAY = 600; // ms — simulates network latency in dev

const mockDelay = () => new Promise((res) => setTimeout(res, MOCK_DELAY));

// Dev-only fixture — ignored when USE_MOCK is false.
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
