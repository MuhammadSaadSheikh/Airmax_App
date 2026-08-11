jest.mock('../src/config/environment', () => ({
  environment: { apiUrl: 'https://unused.test', useMockApi: true },
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
        password: 'airmax123',
        mockRole: 'admin',
      }),
    ).resolves.toMatchObject({ user: { role: 'admin' } });

    await expect(
      authService.login({
        identifier: '+92 300 1234567',
        password: 'airmax123',
        mockRole: 'customer',
      }),
    ).resolves.toMatchObject({ user: { role: 'customer' } });
  });

  it('keeps demo OTP verification', async () => {
    await expect(
      authService.requestOtp('+923001234567'),
    ).resolves.toMatchObject({ developmentCode: '123456' });
    await expect(
      authService.verifyOtp('+923001234567', '123456'),
    ).resolves.toMatchObject({ user: { role: 'customer' } });
  });
});
