import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  ValidationError,
} from '../errors';
import { apiRequest } from '../client';
import {
  mapAuthSession,
  mapCurrentUser,
  mapOtpChallenge,
  mapRegistration,
} from './auth.mapper';
import type {
  AuthOperation,
  AuthSession,
  BackendAuthSession,
  BackendCurrentUser,
  BackendRegistrationResponse,
  CurrentUser,
  LoginInput,
  OtpChallenge,
  RegisterInput,
  RegistrationResult,
} from './auth.models';
import type { AuthenticationService } from '../auth.types';

const AUTH_REQUEST_OPTIONS = {
  authenticate: false,
  refreshOnUnauthorized: false,
  timeoutMs: 12_000,
} as const;

const REFRESH_REQUEST_OPTIONS = {
  ...AUTH_REQUEST_OPTIONS,
  timeoutMs: 10_000,
} as const;

export class AuthRateLimitedError extends Error {
  readonly code = 'RATE_LIMITED' as const;

  constructor(readonly requestId?: string) {
    super('Too many authentication attempts. Please wait and try again.');
    this.name = 'AuthRateLimitedError';
  }
}

export class InactiveAccountError extends AuthenticationError {}

function safeBody(error: ApiError, message: string) {
  return {
    code: error.backendCode,
    message,
    requestId: error.requestId,
  };
}

export function mapAuthApiError(
  error: unknown,
  operation: AuthOperation,
): unknown {
  if (!(error instanceof ApiError)) return error;
  if (error.status === 429) return new AuthRateLimitedError(error.requestId);
  if (error instanceof InactiveAccountError) return error;
  if (error instanceof AuthenticationError) {
    const message =
      operation === 'login'
        ? 'Invalid email, phone number, or password.'
        : operation === 'verifyOtp'
          ? 'The verification code is invalid or expired.'
          : operation === 'refresh' || operation === 'currentUser'
            ? 'Your session has expired. Please sign in again.'
            : 'Authentication failed. Please try again.';
    return new AuthenticationError(
      message,
      error.status,
      safeBody(error, message),
      'UNAUTHORIZED',
    );
  }
  if (error instanceof AuthorizationError) {
    const message = 'You do not have permission to perform this action.';
    return new AuthorizationError(
      message,
      error.status,
      safeBody(error, message),
      'FORBIDDEN',
    );
  }
  if (error instanceof ValidationError) {
    const message =
      operation === 'register' && error.status === 409
        ? 'An account already exists for this phone number or email.'
        : 'Check the authentication details and try again.';
    return new ValidationError(
      message,
      error.status,
      safeBody(error, message),
      'VALIDATION_ERROR',
    );
  }
  if (error instanceof ServerError) {
    const message = 'Authentication service is temporarily unavailable.';
    return new ServerError(
      message,
      error.status,
      safeBody(error, message),
      'SERVER_ERROR',
    );
  }
  return error;
}

async function authCall<T>(
  operation: AuthOperation,
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw mapAuthApiError(error, operation);
  }
}

function requireActive(session: AuthSession): AuthSession {
  if (session.user.status !== 'active') {
    throw new InactiveAccountError(
      `Account is ${session.user.status}. Contact AIRMAX support.`,
      401,
    );
  }
  return session;
}

export const liveAuthService: AuthenticationService = {
  login(input: LoginInput): Promise<AuthSession> {
    return authCall('login', async () => {
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
    });
  },

  register(input: RegisterInput): Promise<RegistrationResult> {
    return authCall('register', async () => {
      const response = await apiRequest<BackendRegistrationResponse>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
        AUTH_REQUEST_OPTIONS,
      );
      return mapRegistration(response);
    });
  },

  requestOtp(phone: string): Promise<OtpChallenge> {
    return authCall('requestOtp', async () => {
      const response = await apiRequest<unknown>(
        '/auth/otp',
        { method: 'POST', body: JSON.stringify({ phone }) },
        AUTH_REQUEST_OPTIONS,
      );
      return mapOtpChallenge(response);
    });
  },

  verifyOtp(
    phone: string,
    challengeId: string,
    code: string,
  ): Promise<AuthSession> {
    return authCall('verifyOtp', async () => {
      const response = await apiRequest<BackendAuthSession>(
        '/auth/otp/verify',
        {
          method: 'POST',
          body: JSON.stringify({ phone, challengeId, code }),
        },
        AUTH_REQUEST_OPTIONS,
      );
      return requireActive(mapAuthSession(response));
    });
  },

  refresh(refreshToken: string): Promise<AuthSession> {
    return authCall('refresh', async () => {
      const response = await apiRequest<BackendAuthSession>(
        '/auth/refresh',
        { method: 'POST', body: JSON.stringify({ refreshToken }) },
        REFRESH_REQUEST_OPTIONS,
      );
      return requireActive(mapAuthSession(response));
    });
  },

  logout(refreshToken: string): Promise<void> {
    return authCall('logout', () =>
      apiRequest<void>(
        '/auth/logout',
        { method: 'POST', body: JSON.stringify({ refreshToken }) },
        { ...AUTH_REQUEST_OPTIONS, timeoutMs: 3_000 },
      ),
    );
  },

  getCurrentUser(): Promise<CurrentUser> {
    return authCall('currentUser', async () => {
      const response = await apiRequest<BackendCurrentUser>('/users/me');
      const user = mapCurrentUser(response);
      if (user.status !== 'active') {
        throw new InactiveAccountError(
          `Account is ${user.status}. Contact AIRMAX support.`,
          401,
        );
      }
      return user;
    });
  },
};
