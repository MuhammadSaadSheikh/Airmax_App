import { environment } from '@/config/environment';
import { getAccessToken, refreshSession } from '@/services/auth/sessionManager';

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

export type ApiRequestOptions = {
  authenticate?: boolean;
  refreshOnUnauthorized?: boolean;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  return executeRequest(path, init, options, false);
}

async function executeRequest<T>(
  path: string,
  init: RequestInit,
  options: ApiRequestOptions,
  retried: boolean,
): Promise<T> {
  const shouldAuthenticate = options.authenticate !== false;
  const requestAccessToken = shouldAuthenticate ? getAccessToken() : null;
  const response = await fetch(`${environment.apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(requestAccessToken
        ? { Authorization: `Bearer ${requestAccessToken}` }
        : {}),
      ...init.headers,
    },
  });
  const body: unknown =
    response.status === 204 ? undefined : await response.json();

  if (
    response.status === 401 &&
    shouldAuthenticate &&
    options.refreshOnUnauthorized !== false &&
    !retried
  ) {
    if (!requestAccessToken || getAccessToken() === requestAccessToken) {
      await refreshSession();
    }
    return executeRequest(path, init, options, true);
  }

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
