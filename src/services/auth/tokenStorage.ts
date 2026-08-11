import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const REFRESH_TOKEN_SERVICE = 'pk.airmax.mobile.refresh-token';
const REFRESH_TOKEN_ACCOUNT = 'airmax-session';
const LEGACY_AUTH_KEYS = ['airmax-auth', 'airmax-access-token'] as const;

export async function setRefreshToken(refreshToken: string): Promise<void> {
  const stored = await Keychain.setGenericPassword(
    REFRESH_TOKEN_ACCOUNT,
    refreshToken,
    {
      service: REFRESH_TOKEN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    },
  );
  if (!stored) throw new Error('Secure refresh token storage is unavailable');
}

export async function getRefreshToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: REFRESH_TOKEN_SERVICE,
  });
  return credentials ? credentials.password : null;
}

export async function removeRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE });
}

export async function removeLegacyAuthStorage(): Promise<void> {
  await AsyncStorage.multiRemove([...LEGACY_AUTH_KEYS]);
}
