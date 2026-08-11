jest.mock('../src/config/environment', () => ({
  environment: { apiUrl: 'https://api.example.test', useMockApi: false },
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
    ).rejects.toThrow('Invalid credentials');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
