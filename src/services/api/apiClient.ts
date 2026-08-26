import { getAccessToken, refreshSession } from '@/services/auth/sessionManager';
import { API_BASE_URL, API_TIMEOUT } from './apiConfig';
import {
  ApiError,
  NetworkError,
  RequestCancelledError,
  TimeoutError,
  ValidationError,
  apiErrorForResponse,
} from './apiError';
import type {
  ApiRequestConfig,
  ApiRequestMetadata,
  ApiResponse,
  ApiResponseMeta,
} from './apiTypes';

export type ApiRequestOptions = ApiRequestConfig;
export const DEFAULT_REQUEST_TIMEOUT_MS = API_TIMEOUT;
const INVALID_JSON = Symbol('INVALID_JSON');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    isRecord(value) &&
    'data' in value &&
    isRecord(value.meta) &&
    typeof value.meta.requestId === 'string' &&
    Array.isArray(value.errors)
  );
}

function responseRequestId(response: Response): string | undefined {
  return response.headers?.get?.('x-request-id') ?? undefined;
}

function createRequestId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 12);
  return `mobile-${time}-${random}`;
}

function headersToRecord(
  headers?: RequestInit['headers'],
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) result[key] = value;
    return result;
  }
  if (typeof (headers as Headers).forEach === 'function') {
    (headers as Headers).forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  for (const [key, value] of Object.entries(
    headers as Record<string, string>,
  )) {
    result[key] = value;
  }
  return result;
}

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
    if (externalSignal?.aborted) {
      throw new RequestCancelledError(
        'Request was cancelled.',
        undefined,
        undefined,
        'REQUEST_CANCELLED',
      );
    }
    if (controller.signal.aborted) {
      throw new TimeoutError(
        'Request timed out. Please try again.',
        undefined,
        undefined,
        'TIMEOUT_ERROR',
      );
    }
    if (error instanceof ApiError) throw error;
    throw new NetworkError(
      'Network unavailable. Check your connection.',
      undefined,
      undefined,
      'NETWORK_ERROR',
    );
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
  const requestId = options.requestId ?? createRequestId();
  return executeRequest(path, init, { ...options, requestId }, false);
}

async function executeRequest<T>(
  path: string,
  init: RequestInit,
  options: ApiRequestOptions & { requestId: string },
  retried: boolean,
): Promise<T> {
  const shouldAuthenticate = options.authenticate !== false;
  const requestAccessToken = shouldAuthenticate ? getAccessToken() : null;
  const response = await fetchWithTimeout(
    `${API_BASE_URL}${path}`,
    {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Request-Id': options.requestId,
        ...(requestAccessToken
          ? { Authorization: `Bearer ${requestAccessToken}` }
          : {}),
        ...headersToRecord(init.headers),
      },
    },
    options.timeoutMs ?? API_TIMEOUT,
  );
  const body = await parseResponseBody(response);
  const headerRequestId = responseRequestId(response);
  const envelopeMeta =
    isApiResponse<unknown>(body) && body.meta ? body.meta : undefined;
  const metadata: ApiRequestMetadata = {
    requestId: envelopeMeta?.requestId ?? headerRequestId ?? options.requestId,
    generatedAt: envelopeMeta?.generatedAt,
    status: response.status,
  };
  options.onResponseMeta?.(metadata);

  if (response.ok && body === INVALID_JSON) {
    throw new ValidationError(
      'Invalid JSON response from server',
      response.status,
      { requestId: metadata.requestId },
      'VALIDATION_ERROR',
    );
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
    throw apiErrorForResponse(response.status, body, headerRequestId);
  }
  return (isApiResponse<T>(body) ? body.data : body) as T;
}

export const apiClient = {
  request: apiRequest,
};

export type { ApiResponseMeta };
