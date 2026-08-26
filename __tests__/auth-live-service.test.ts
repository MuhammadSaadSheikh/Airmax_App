jest.mock('../src/config/environment', () => ({
  environment: {
    name: 'production',
    apiUrl: 'https://api.example.test',
    authMode: 'live',
    allowsMockAuth: false,
    useMockApi: false,
    isProduction: true,
  },
}));
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
  SECURITY_LEVEL: { SECURE_SOFTWARE: 'secure-software' },
  STORAGE_TYPE: { AES_GCM_NO_AUTH: 'aes-gcm' },
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  multiRemove: jest.fn(),
}));

import { authService } from '../src/services/api/auth.service';

const backendSession = {
  accessToken: 'live-access',
  refreshToken: 'live-refresh',
  user: {
    id: 'customer-1',
    name: 'Live Customer',
    phone: '+923001234567',
    email: 'customer@example.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    address: null,
    connectionId: 'AMX-1',
  },
};

describe('live auth service', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  it('logs in through the backend and ignores the mock role', async () => {
    jest.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => backendSession,
    } as Response);

    const session = await authService.login({
      identifier: 'customer@example.com',
      password: 'password123',
      mockRole: 'admin',
    });

    expect(session.user.role).toBe('customer');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.test/auth/login',
      expect.objectContaining({
        body: JSON.stringify({
          identifier: 'customer@example.com',
          password: 'password123',
        }),
      }),
    );
  });

  it('does not fall back to mock auth after a live failure', async () => {
    jest.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response);

    await expect(
      authService.login({
        identifier: 'customer@example.com',
        password: 'password123',
        mockRole: 'admin',
      }),
    ).rejects.toThrow('Invalid email, phone number, or password.');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('propagates the OTP challenge id during verification', async () => {
    jest.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(backendSession),
    } as Response);

    await authService.verifyOtp(
      '+923001234567',
      'a9e8eb90-a8b1-4e89-b78d-7e96e16ea42a',
      '654321',
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.test/auth/otp/verify',
      expect.objectContaining({
        body: JSON.stringify({
          phone: '+923001234567',
          challengeId: 'a9e8eb90-a8b1-4e89-b78d-7e96e16ea42a',
          code: '654321',
        }),
      }),
    );
  });

  it.each(['PENDING', 'SUSPENDED', 'DISABLED'])(
    'rejects a %s account returned by authentication',
    async status => {
      jest.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            ...backendSession,
            user: { ...backendSession.user, status },
          }),
      } as Response);

      await expect(
        authService.login({
          identifier: 'user@example.test',
          password: 'password',
        }),
      ).rejects.toThrow(`Account is ${status.toLowerCase()}`);
    },
  );
});
