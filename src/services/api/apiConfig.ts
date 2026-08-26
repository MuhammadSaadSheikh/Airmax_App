import { environment, type AirmaxEnvironment } from '@/config/environment';
import type { ApiEnvironment } from './apiTypes';

export const DEFAULT_API_TIMEOUT = 15_000;

export type ApiConfig = {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENVIRONMENT: ApiEnvironment;
};

export function createApiConfig(
  source: Pick<AirmaxEnvironment, 'name' | 'apiUrl'>,
  timeout = DEFAULT_API_TIMEOUT,
): ApiConfig {
  const baseUrl = source.apiUrl.replace(/\/+$/, '');
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new Error('API_BASE_URL must be an absolute HTTP(S) URL');
  }
  if (
    (source.name === 'staging' || source.name === 'production') &&
    !baseUrl.startsWith('https://')
  ) {
    throw new Error(`${source.name} API_BASE_URL must use HTTPS`);
  }
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new Error('API_TIMEOUT must be a positive number');
  }
  return {
    API_BASE_URL: baseUrl,
    API_TIMEOUT: timeout,
    ENVIRONMENT: source.name,
  };
}

export const apiConfig = createApiConfig(environment);
export const { API_BASE_URL, API_TIMEOUT, ENVIRONMENT } = apiConfig;
