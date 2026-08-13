jest.mock('../src/config/environment', () => ({
  environment: {
    name: 'mock',
    apiUrl: 'https://mock.invalid',
    authMode: 'mock',
    allowsMockAuth: true,
    useMockApi: true,
    isProduction: false,
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

describe('mock auth compatibility', () => {
  it('keeps selectable demo customer and admin sessions', async () => {
    await expect(
      authService.login({
        identifier: 'admin@airmax.pk',
        password: 'any-password',
        mockRole: 'admin',
      }),
    ).resolves.toMatchObject({ user: { role: 'admin' } });

    await expect(
      authService.login({
        identifier: '+92 300 1234567',
        password: 'any-password',
        mockRole: 'customer',
      }),
    ).resolves.toMatchObject({ user: { role: 'customer' } });
  });

  it('uses challenge-bound OTP verification without a demo code', async () => {
    const challenge = await authService.requestOtp('+923001234567');
    expect(challenge).not.toHaveProperty('developmentCode');
    await expect(
      authService.verifyOtp('+923001234567', challenge.challengeId, '654321'),
    ).resolves.toMatchObject({ user: { role: 'customer' } });
  });
});
