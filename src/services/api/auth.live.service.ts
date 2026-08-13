import { AuthenticationError, ValidationError } from './errors';
import { apiRequest } from './client';
import { mapAuthSession, mapCurrentUser } from './auth.mapper';
import type {
  AuthSession,
  BackendAuthSession,
  BackendCurrentUser,
  CurrentUser,
  LoginInput,
  OtpChallenge,
} from './auth.models';
import type { AuthenticationService } from './auth.types';

const AUTH_REQUEST_OPTIONS = {
  authenticate: false,
  refreshOnUnauthorized: false,
  timeoutMs: 12_000,
} as const;

const REFRESH_REQUEST_OPTIONS = {
  ...AUTH_REQUEST_OPTIONS,
  timeoutMs: 10_000,
} as const;

function requireActive(session: AuthSession): AuthSession {
  if (session.user.status !== 'active') {
    throw new AuthenticationError(
      `Account is ${session.user.status}. Contact AIRMAX support.`,
      401,
    );
  }
  return session;
}

function mapOtpChallenge(value: unknown): OtpChallenge {
  const challengeId = (value as { challengeId?: unknown } | null)?.challengeId;
  if (typeof challengeId !== 'string' || challengeId.length === 0) {
    throw new ValidationError('Invalid OTP challenge response', 502);
  }
  return { challengeId };
}

export const liveAuthService: AuthenticationService = {
  async login(input: LoginInput): Promise<AuthSession> {
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
    return requireActive(mapAuthSession(response));
  },

  async requestOtp(phone: string): Promise<OtpChallenge> {
    const response = await apiRequest<unknown>(
      '/auth/otp',
      { method: 'POST', body: JSON.stringify({ phone }) },
      AUTH_REQUEST_OPTIONS,
    );
    return mapOtpChallenge(response);
  },

  async verifyOtp(
    phone: string,
    challengeId: string,
    code: string,
  ): Promise<AuthSession> {
    const response = await apiRequest<BackendAuthSession>(
      '/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, challengeId, code }),
      },
      AUTH_REQUEST_OPTIONS,
    );
    return requireActive(mapAuthSession(response));
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    const response = await apiRequest<BackendAuthSession>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
      REFRESH_REQUEST_OPTIONS,
    );
    return requireActive(mapAuthSession(response));
  },

  async logout(refreshToken: string): Promise<void> {
    await apiRequest<void>(
      '/auth/logout',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
      { ...AUTH_REQUEST_OPTIONS, timeoutMs: 3_000 },
    );
  },

  async getCurrentUser(): Promise<CurrentUser> {
    const response = await apiRequest<BackendCurrentUser>('/users/me');
    const user = mapCurrentUser(response);
    if (user.status !== 'active') {
      throw new AuthenticationError(
        `Account is ${user.status}. Contact AIRMAX support.`,
        401,
      );
    }
    return user;
  },
};
