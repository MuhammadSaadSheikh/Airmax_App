const mockApiRequest = jest.fn();

jest.mock('../src/services/api/client', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import {
  ApiError,
  AuthenticationError,
  ValidationError,
} from '../src/services/api/errors';
import {
  AuthRateLimitedError,
  liveAuthService,
} from '../src/services/api/auth/auth.service';

const activeUser = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'AIRMAX Customer',
  phone: '+923001234567',
  email: 'customer@example.test',
  role: 'CUSTOMER',
  status: 'ACTIVE',
} as const;

const backendSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: activeUser,
};

describe('Phase 4.4B production authentication service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in through the production endpoint and maps the token pair', async () => {
    mockApiRequest.mockResolvedValue(backendSession);
    await expect(
      liveAuthService.login({
        identifier: 'customer@example.test',
        password: 'password123',
      }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { role: 'customer', status: 'active' },
    });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          identifier: 'customer@example.test',
          password: 'password123',
        }),
      }),
      expect.objectContaining({ authenticate: false }),
    );
  });

  it('maps invalid credentials to a safe unauthorized error', async () => {
    mockApiRequest.mockRejectedValue(
      new AuthenticationError(
        'raw backend credential message',
        401,
        { code: 'UNAUTHORIZED', requestId: 'login-request' },
        'UNAUTHORIZED',
      ),
    );
    await expect(
      liveAuthService.login({ identifier: 'unknown', password: 'password123' }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Invalid email, phone number, or password.',
      requestId: 'login-request',
    });
  });

  it('registers a pending user without creating a mobile session', async () => {
    mockApiRequest.mockResolvedValue({
      user: { ...activeUser, status: 'PENDING' },
    });
    const input = {
      name: 'New Customer',
      phone: '+923009999999',
      email: 'new@example.test',
      password: 'password123',
    };
    await expect(liveAuthService.register(input)).resolves.toMatchObject({
      user: { role: 'customer', status: 'pending' },
    });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
      expect.objectContaining({ authenticate: false }),
    );
  });

  it('maps duplicate registration without exposing raw database errors', async () => {
    mockApiRequest.mockRejectedValue(
      new ValidationError(
        'Unique constraint failed on User_phone_key',
        409,
        { requestId: 'register-request' },
        'VALIDATION_ERROR',
      ),
    );
    await expect(
      liveAuthService.register({
        name: 'Duplicate',
        phone: '+923001234567',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'An account already exists for this phone number or email.',
      requestId: 'register-request',
    });
  });

  it('requests an OTP and preserves its challenge binding', async () => {
    mockApiRequest.mockResolvedValue({ challengeId: 'challenge-id' });
    await expect(liveAuthService.requestOtp('+923001234567')).resolves.toEqual({
      challengeId: 'challenge-id',
    });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/otp',
      expect.objectContaining({
        body: JSON.stringify({ phone: '+923001234567' }),
      }),
      expect.objectContaining({ refreshOnUnauthorized: false }),
    );
  });

  it('verifies OTP through the challenge-bound backend endpoint', async () => {
    mockApiRequest.mockResolvedValue(backendSession);
    await expect(
      liveAuthService.verifyOtp('+923001234567', 'challenge-id', '654321'),
    ).resolves.toMatchObject({ user: { status: 'active' } });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/otp/verify',
      expect.objectContaining({
        body: JSON.stringify({
          phone: '+923001234567',
          challengeId: 'challenge-id',
          code: '654321',
        }),
      }),
      expect.any(Object),
    );
  });

  it('maps invalid or expired OTPs to a safe unauthorized error', async () => {
    mockApiRequest.mockRejectedValue(
      new AuthenticationError('raw OTP error', 401, undefined, 'UNAUTHORIZED'),
    );
    await expect(
      liveAuthService.verifyOtp('+923001234567', 'challenge-id', '000000'),
    ).rejects.toMatchObject({
      message: 'The verification code is invalid or expired.',
      code: 'UNAUTHORIZED',
    });
  });

  it('maps authentication throttling to RATE_LIMITED with request correlation', async () => {
    mockApiRequest.mockRejectedValue(
      new ApiError(
        'raw cooldown response',
        429,
        { requestId: 'rate-request' },
        'API_ERROR',
      ),
    );
    const error = await liveAuthService
      .requestOtp('+923001234567')
      .catch(value => value as unknown);
    expect(error).toBeInstanceOf(AuthRateLimitedError);
    expect(error).toMatchObject({
      code: 'RATE_LIMITED',
      requestId: 'rate-request',
    });
  });

  it('refreshes through the backend rotation endpoint and maps expiry safely', async () => {
    mockApiRequest.mockResolvedValueOnce({
      ...backendSession,
      accessToken: 'rotated-access',
      refreshToken: 'rotated-refresh',
    });
    await expect(
      liveAuthService.refresh('stored-refresh'),
    ).resolves.toMatchObject({
      accessToken: 'rotated-access',
      refreshToken: 'rotated-refresh',
    });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/refresh',
      expect.objectContaining({
        body: JSON.stringify({ refreshToken: 'stored-refresh' }),
      }),
      expect.objectContaining({ refreshOnUnauthorized: false }),
    );

    mockApiRequest.mockRejectedValueOnce(
      new AuthenticationError(
        'raw refresh error',
        401,
        undefined,
        'UNAUTHORIZED',
      ),
    );
    await expect(
      liveAuthService.refresh('expired-refresh'),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Your session has expired. Please sign in again.',
    });
  });

  it('revokes the supplied refresh token through backend logout', async () => {
    mockApiRequest.mockResolvedValue(undefined);
    await expect(
      liveAuthService.logout('stored-refresh'),
    ).resolves.toBeUndefined();
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'stored-refresh' }),
      },
      expect.objectContaining({ authenticate: false, timeoutMs: 3_000 }),
    );
  });
});
