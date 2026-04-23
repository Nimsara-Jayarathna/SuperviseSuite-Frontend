import type {
  AuthUser,
  ForgotPasswordRequest,
  RegisterConfig,
  RegisterCompleteResponse,
  LoginResponse,
  LoginRequest,
  ResetPasswordRequest,
  RegisterRequest,
  RegisterVerifyResponse,
  RegisterResponse,
  SupervisorRegisterRequest,
  ValidateResetTokenResponse,
} from '../types';
import { apiClient } from '@/services/apiClient';

// Switch to false once the backend /api/auth/* endpoints are live.
// Mock credentials must never reach a production build.
const USE_MOCK = false;

const MOCK_DELAY = 600; // ms — simulates network latency in dev

const mockDelay = () => new Promise((res) => setTimeout(res, MOCK_DELAY));
let registerConfigCache: Promise<RegisterConfig> | null = null;

// Dev-only fixture — ignored when USE_MOCK is false.
const MOCK_RESPONSE: LoginResponse = {
  user: {
    id: 'mock-user-id',
    email: 'demo@supervisesuite.com',
    role: 'STUDENT',
    firstName: 'Demo',
    lastName: 'User',
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

  async registerSupervisor(body: SupervisorRegisterRequest): Promise<RegisterResponse> {
    if (USE_MOCK) {
      await mockDelay();
      return {
        id: 'mock-user-id',
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        registrationNumber: null,
        role: 'SUPERVISOR',
      };
    }
    return apiClient.post<RegisterResponse>('/api/auth/register/supervisor', body);
  },

  async registerInit(body: { email: string }): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/auth/register/init', body);
  },

  async registerVerify(body: { email: string; otp: string }): Promise<RegisterVerifyResponse> {
    return apiClient.post<RegisterVerifyResponse>('/api/auth/register/verify', body);
  },

  async registerComplete(body: {
    registrationToken: string;
    fname: string;
    lname: string;
    password: string;
    name?: string;
    role?: string;
  }): Promise<RegisterCompleteResponse> {
    return apiClient.post<{ user: AuthUser }>('/api/auth/register/complete', body);
  },

  getRegisterConfig(): Promise<RegisterConfig> {
    if (!registerConfigCache) {
      registerConfigCache = apiClient
        .get<RegisterConfig>('/api/auth/register/config')
        .catch((error) => {
          registerConfigCache = null;
          throw error;
        });
    }
    return registerConfigCache;
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

  async forgotPassword(body: ForgotPasswordRequest): Promise<void> {
    return apiClient.post<void>('/api/auth/forgot-password', body);
  },

  async validateResetToken(token: string): Promise<ValidateResetTokenResponse> {
    return apiClient.get<ValidateResetTokenResponse>(
      `/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
    );
  },

  async resetPassword(body: ResetPasswordRequest): Promise<void> {
    return apiClient.post<void>('/api/auth/reset-password', body);
  },
};
