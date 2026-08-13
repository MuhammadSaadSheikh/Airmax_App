import { NativeModules, Platform } from 'react-native';

export type AirmaxEnvironmentName =
  | 'mock'
  | 'development-live'
  | 'staging'
  | 'production';

export type AirmaxEnvironment = {
  name: AirmaxEnvironmentName;
  apiUrl: string;
  authMode: 'mock' | 'live';
  allowsMockAuth: boolean;
  /** Compatibility for existing mock repositories; no longer derived from __DEV__. */
  useMockApi: boolean;
  isProduction: boolean;
};

type NativeEnvironmentModule = { environment?: unknown };

const environmentNames: readonly AirmaxEnvironmentName[] = [
  'mock',
  'development-live',
  'staging',
  'production',
];

export function resolveEnvironment(
  value: unknown,
  platform: 'android' | 'ios' | 'other' =
    Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : 'other',
): AirmaxEnvironment {
  if (
    typeof value !== 'string' ||
    !environmentNames.includes(value as AirmaxEnvironmentName)
  ) {
    throw new Error('AIRMAX_ENV must be configured by the native build');
  }

  const name = value as AirmaxEnvironmentName;
  const developmentApiUrl =
    platform === 'android'
      ? 'http://10.0.2.2:4000/api/v1'
      : 'http://localhost:4000/api/v1';
  const apiUrls: Record<AirmaxEnvironmentName, string> = {
    mock: 'https://mock.invalid',
    'development-live': developmentApiUrl,
    staging: 'https://staging-api.airmax.pk/api/v1',
    production: 'https://api.airmax.pk/api/v1',
  };

  return {
    name,
    apiUrl: apiUrls[name],
    authMode: name === 'mock' ? 'mock' : 'live',
    allowsMockAuth: name === 'mock',
    useMockApi: name === 'mock',
    isProduction: name === 'production',
  };
}

const nativeEnvironment = (
  NativeModules.AirmaxEnvironment as NativeEnvironmentModule | undefined
)?.environment;

// Tests supply AIRMAX_ENV explicitly; device builds must use the native constant.
const configuredEnvironment =
  nativeEnvironment ??
  (process.env.NODE_ENV === 'test' ? process.env.AIRMAX_ENV ?? 'mock' : undefined);

export const environment = resolveEnvironment(configuredEnvironment);
