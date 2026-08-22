import type { Role } from '@/types';
import { AuthenticationError, ValidationError } from './errors';
import { mockDelay } from './client';
import type {
  AuthSession,
  CurrentUser,
  LoginInput,
  OtpChallenge,
} from './auth.models';
import type { AuthenticationService } from './auth.types';

let mockCurrentUser: CurrentUser | null = null;
let challengeCounter = 0;
const activeChallenges = new Map<string, string>();

function mockSession(role: Role, identifier: string): AuthSession {
  const isAdmin = role === 'admin';
  const user: CurrentUser = {
    id: isAdmin ? 'admin-mock' : 'customer-mock',
    name: isAdmin ? 'Mock Admin' : 'Mock Customer',
    phone: identifier.includes('@') ? '+923000000000' : identifier,
    email: identifier.includes('@') ? identifier : undefined,
    role,
    adminRole: isAdmin ? 'ADMIN' : undefined,
    status: 'active',
    subscriptions: [],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
  mockCurrentUser = user;
  return {
    accessToken: `mock-access:${role}:${Date.now()}`,
    refreshToken: `mock-refresh:${role}`,
    user,
  };
}

function roleFromRefreshToken(token: string): Role {
  const role = token.split(':')[1];
  if (role === 'admin' || role === 'customer') return role;
  throw new AuthenticationError('Invalid mock session', 401);
}

export const mockAuthService: AuthenticationService = {
  async login(input: LoginInput): Promise<AuthSession> {
    await mockDelay();
    if (input.password.length < 8) {
      throw new ValidationError(
        'Mock passwords must be at least 8 characters',
        422,
      );
    }
    return mockSession(input.mockRole ?? 'customer', input.identifier);
  },

  async requestOtp(phone: string): Promise<OtpChallenge> {
    await mockDelay();
    const challengeId = `mock-challenge-${++challengeCounter}`;
    activeChallenges.set(challengeId, phone);
    return { challengeId };
  },

  async verifyOtp(
    phone: string,
    challengeId: string,
    code: string,
  ): Promise<AuthSession> {
    await mockDelay();
    if (activeChallenges.get(challengeId) !== phone || !/^\d{6}$/.test(code)) {
      throw new AuthenticationError('Invalid mock OTP challenge', 401);
    }
    activeChallenges.delete(challengeId);
    return mockSession('customer', phone);
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    await mockDelay(25);
    return mockSession(roleFromRefreshToken(refreshToken), '+923000000000');
  },

  async logout(): Promise<void> {
    mockCurrentUser = null;
    activeChallenges.clear();
  },

  async getCurrentUser(): Promise<CurrentUser> {
    if (!mockCurrentUser) throw new AuthenticationError('No mock session', 401);
    return mockCurrentUser;
  },
};
