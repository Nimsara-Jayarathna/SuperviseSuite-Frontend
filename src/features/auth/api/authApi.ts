import type { LoginResponse, LoginRequest, RegisterRequest, RegisterResponse } from '../types';
import { apiClient } from '@/services/apiClient';

// Switch to false once the backend /api/auth/* endpoints are live.
// Mock credentials must never reach a production build.
const USE_MOCK = false;

const MOCK_DELAY = 600; // ms — simulates network latency in dev

const mockDelay = () => new Promise((res) => setTimeout(res, MOCK_DELAY));

// Dev-only fixture — ignored when USE_MOCK is false.
const MOCK_RESPONSE: LoginResponse = {
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
  async login(body: LoginRequest): Promise<LoginResponse> {
    if (USE_MOCK) {
      await mockDelay();
      return { ...MOCK_RESPONSE, user: { ...MOCK_RESPONSE.user, email: body.email } };
    }
    return apiClient.post<LoginResponse>('/api/auth/login', body);
  },

  async register(body: RegisterRequest): Promise<RegisterResponse> {
    if (USE_MOCK) {
      await mockDelay();
      return {
        id: 'mock-user-id',
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        registrationNumber: body.registrationNumber,
        role: 'STUDENT',
      };
    }
    return apiClient.post<RegisterResponse>('/api/auth/register', body);
  },

  /**
   * Exchanges the {@code ss_refresh_token} httpOnly cookie for a fresh pair of
   * cookies. The browser sends the cookie automatically; no token handling is
   * needed here. Called by the {@code apiClient} 401 interceptor.
   */
  async refresh(): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/api/auth/refresh', {});
  },

  /**
   * Revokes the {@code ss_refresh_token} cookie server-side and instructs the
   * browser to delete both auth cookies via {@code Max-Age=0} Set-Cookie headers.
   */
  async logout(): Promise<void> {
    return apiClient.post<void>('/api/auth/logout', {});
  },
};
