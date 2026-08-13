import { environment } from '@/config/environment';
import { getAccessToken, refreshSession } from '@/services/auth/sessionManager';
import {
  ApiError,
  type ApiErrorBody,
  NetworkError,
  TimeoutError,
  ValidationError,
  apiErrorForResponse,
} from './errors';

export { ApiError } from './errors';
export type { ApiErrorBody } from './errors';

export type ApiRequestOptions = {
  authenticate?: boolean;
  refreshOnUnauthorized?: boolean;
  timeoutMs?: number;
};

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const INVALID_JSON = Symbol('INVALID_JSON');

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  try {
    if (typeof response.text === 'function') {
      const text = await response.text();
      if (!text) return undefined;
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return response.ok ? INVALID_JSON : { message: text };
      }
    }
    return await response.json();
  } catch {
    return undefined;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = init.signal;
  const abort = () => controller.abort();
  externalSignal?.addEventListener('abort', abort, { once: true });
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw new TimeoutError('Request timed out. Please try again.', undefined);
    }
    if (error instanceof ApiError) throw error;
    throw new NetworkError('Network unavailable. Check your connection.', undefined);
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abort);
  }
}

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
  const response = await fetchWithTimeout(
    `${environment.apiUrl}${path}`,
    {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(requestAccessToken
          ? { Authorization: `Bearer ${requestAccessToken}` }
          : {}),
        ...init.headers,
      },
    },
    options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
  );
  const body = await parseResponseBody(response);

  if (response.ok && body === INVALID_JSON) {
    throw new ValidationError('Invalid JSON response from server', response.status);
  }

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
    throw apiErrorForResponse(response.status, body as ApiErrorBody | undefined);
  }
  return body as T;
}

export const mockDelay = (milliseconds = 250) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));
