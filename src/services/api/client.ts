import AsyncStorage from '@react-native-async-storage/async-storage';
import { environment } from '@/config/environment';

export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = await AsyncStorage.getItem('airmax-access-token');
  const response = await fetch(`${environment.apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  const body: unknown =
    response.status === 204 ? undefined : await response.json();
  if (!response.ok) {
    const error = body as ApiErrorBody | undefined;
    throw new ApiError(
      error?.message ?? 'AIRMAX request failed',
      response.status,
      error,
    );
  }
  return body as T;
}

export const mockDelay = (milliseconds = 250) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));
