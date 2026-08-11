import { environment } from '@/config/environment';
import type { Role } from '@/types';
import { apiRequest, mockDelay } from './client';
import { mapAuthSession, mapCurrentUser } from './auth.mapper';
import type {
  AuthSession,
  BackendAuthSession,
  BackendCurrentUser,
  CurrentUser,
  LoginInput,
  OtpChallenge,
} from './auth.models';

const AUTH_REQUEST_OPTIONS = {
  authenticate: false,
  refreshOnUnauthorized: false,
} as const;

const MOCK_PASSWORD = 'airmax123';
const MOCK_OTP = '123456';
let mockCurrentUser: CurrentUser | null = null;

function mockSession(role: Role, identifier: string): AuthSession {
  const isAdmin = role === 'admin';
  const user: CurrentUser = {
    id: isAdmin ? 'admin-1' : 'u1',
    name: isAdmin ? 'Danish Admin' : 'Ahmed Khan',
    phone: identifier.includes('@') ? '+92 300 1234567' : identifier,
    email: identifier.includes('@')
      ? identifier
      : isAdmin
        ? 'admin@airmax.pk'
        : 'ahmed@example.com',
    role,
    status: 'active',
    address: isAdmin ? 'AIRMAX HQ, Karachi' : 'DHA Phase 6, Karachi',
    connectionId: isAdmin ? undefined : 'AMX-1042',
    cnic: isAdmin ? undefined : '42101-1234567-1',
    installationDate: isAdmin ? undefined : '15 Jan 2025',
    router: isAdmin ? undefined : 'Huawei HG8145V5',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
    subscriptions: [],
  };
  mockCurrentUser = user;
  return {
    accessToken: `mock-access:${role}:${Date.now()}`,
    refreshToken: `mock-refresh:${role}`,
    user,
  };
}

function roleFromMockRefreshToken(refreshToken: string): Role {
  const role = refreshToken.split(':')[1];
  if (role === 'admin' || role === 'customer') return role;
  throw new Error('Invalid mock refresh token');
}

export const authService = {
  async login(input: LoginInput): Promise<AuthSession> {
    if (environment.useMockApi) {
      await mockDelay();
      if (input.password !== MOCK_PASSWORD) {
        throw new Error('Invalid demo credentials');
      }
      return mockSession(input.mockRole ?? 'customer', input.identifier);
    }
    const response = await apiRequest<BackendAuthSession>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          identifier: input.identifier,
          password: input.password,
        }),
      },
      AUTH_REQUEST_OPTIONS,
    );
    return mapAuthSession(response);
  },

  async requestOtp(phone: string): Promise<OtpChallenge> {
    if (environment.useMockApi) {
      await mockDelay();
      return { challengeId: 'mock-otp', developmentCode: MOCK_OTP };
    }
    return apiRequest<OtpChallenge>(
      '/auth/otp',
      { method: 'POST', body: JSON.stringify({ phone }) },
      AUTH_REQUEST_OPTIONS,
    );
  },

  async verifyOtp(phone: string, code: string): Promise<AuthSession> {
    if (environment.useMockApi) {
      await mockDelay();
      if (code !== MOCK_OTP) throw new Error('Invalid demo OTP');
      return mockSession('customer', phone);
    }
    const response = await apiRequest<BackendAuthSession>(
      '/auth/otp/verify',
      { method: 'POST', body: JSON.stringify({ phone, code }) },
      AUTH_REQUEST_OPTIONS,
    );
    return mapAuthSession(response);
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    if (environment.useMockApi) {
      await mockDelay(25);
      return mockSession(
        roleFromMockRefreshToken(refreshToken),
        '+92 300 1234567',
      );
    }
    const response = await apiRequest<BackendAuthSession>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
      AUTH_REQUEST_OPTIONS,
    );
    return mapAuthSession(response);
  },

  async logout(refreshToken: string): Promise<void> {
    if (environment.useMockApi) {
      await mockDelay(25);
      mockCurrentUser = null;
      return;
    }
    await apiRequest<void>(
      '/auth/logout',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
      AUTH_REQUEST_OPTIONS,
    );
  },

  async getCurrentUser(): Promise<CurrentUser> {
    if (environment.useMockApi) {
      await mockDelay();
      if (!mockCurrentUser) throw new Error('No active mock session');
      return mockCurrentUser;
    }
    const response = await apiRequest<BackendCurrentUser>('/users/me');
    return mapCurrentUser(response);
  },
};
