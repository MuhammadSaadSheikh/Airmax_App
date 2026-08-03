import { PermissionsAndroid, Platform } from 'react-native';

export interface PushRegistration {
  platform: 'android' | 'ios';
  token: string;
}

/**
 * Requests the OS notification permission. The FCM/APNs token is supplied by
 * the production messaging adapter and registered with POST /notifications/devices.
 */
export async function registerForPushNotifications(): Promise<PushRegistration | null> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return null;
  }
  return null;
}
