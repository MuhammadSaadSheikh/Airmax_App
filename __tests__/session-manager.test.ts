jest.mock('../src/services/auth/tokenStorage', () => ({
  getRefreshToken: jest.fn(),
  setRefreshToken: jest.fn(),
  removeRefreshToken: jest.fn(),
}));

import type { AuthSession } from '../src/services/api/auth.models';
import {
  clearSession,
  configureSessionManager,
  establishSession,
  getAccessToken,
  refreshSession,
  restoreSession,
  SessionExpiredError,
} from '../src/services/auth/sessionManager';
import {
  getRefreshToken,
  removeRefreshToken,
  setRefreshToken,
} from '../src/services/auth/tokenStorage';
import {
  AuthenticationError,
  NetworkError,
  ServerError,
  TimeoutError,
} from '../src/services/api/errors';

const session: AuthSession = {
  accessToken: 'new-access',
  refreshToken: 'rotated-refresh',
  user: {
    id: 'user-1',
    name: 'Customer',
    phone: '+923001234567',
    role: 'customer',
    status: 'active',
  },
};

describe('session manager', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(removeRefreshToken).mockResolvedValue();
    jest.mocked(setRefreshToken).mockResolvedValue();
    await clearSession();
    jest.clearAllMocks();
  });

  it('restores a cold session by rotating the secure refresh token', async () => {
    const refresh = jest.fn().mockResolvedValue(session);
    jest.mocked(getRefreshToken).mockResolvedValue('stored-refresh');
    configureSessionManager({ refresh });

    await expect(restoreSession()).resolves.toEqual(session);
    expect(refresh).toHaveBeenCalledWith('stored-refresh');
    expect(setRefreshToken).toHaveBeenCalledWith('rotated-refresh');
    expect(getAccessToken()).toBe('new-access');
  });

  it('shares one refresh across concurrent requests', async () => {
    let resolveRefresh: (value: AuthSession) => void = () => undefined;
    const refresh = jest.fn(
      () =>
        new Promise<AuthSession>(resolve => {
          resolveRefresh = resolve;
        }),
    );
    jest.mocked(getRefreshToken).mockResolvedValue('stored-refresh');
    configureSessionManager({ refresh });

    const first = refreshSession();
    const second = refreshSession();
    await Promise.resolve();
    resolveRefresh(session);

    await expect(Promise.all([first, second])).resolves.toEqual([
      session,
      session,
    ]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not restore a session when logout wins an in-flight refresh race', async () => {
    let resolveRefresh: (value: AuthSession) => void = () => undefined;
    jest.mocked(getRefreshToken).mockResolvedValue('stored-refresh');
    configureSessionManager({
      refresh: () =>
        new Promise<AuthSession>(resolve => {
          resolveRefresh = resolve;
        }),
    });

    const refreshing = refreshSession();
    await Promise.resolve();
    await clearSession();
    resolveRefresh(session);

    await expect(refreshing).rejects.toBeInstanceOf(SessionExpiredError);
    expect(getAccessToken()).toBeNull();
    expect(setRefreshToken).not.toHaveBeenCalled();
  });

  it.each(['expired', 'revoked', 'disabled'])('cleans up an %s refresh token', async () => {
    const onExpired = jest.fn();
    jest.mocked(getRefreshToken).mockResolvedValue('invalid-refresh');
    configureSessionManager({
      refresh: jest.fn().mockRejectedValue(
        new AuthenticationError('Unauthorized', 401),
      ),
      onExpired,
    });

    await expect(refreshSession()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(removeRefreshToken).toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it.each([
    new NetworkError('Offline', undefined),
    new TimeoutError('Timed out', undefined),
    new ServerError('Service unavailable', 503),
  ])('preserves the secure session after transient refresh failure', async error => {
    const onExpired = jest.fn();
    await establishSession({
      ...session,
      accessToken: 'existing-access',
      refreshToken: 'stored-refresh',
    });
    jest.clearAllMocks();
    jest.mocked(getRefreshToken).mockResolvedValue('stored-refresh');
    configureSessionManager({
      refresh: jest.fn().mockRejectedValue(error),
      onExpired,
    });

    await expect(refreshSession()).rejects.toBe(error);
    expect(removeRefreshToken).not.toHaveBeenCalled();
    expect(onExpired).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe('existing-access');
  });
});
