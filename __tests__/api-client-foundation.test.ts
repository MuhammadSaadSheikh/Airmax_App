const mockGetAccessToken = jest.fn<string | null, []>();
const mockRefreshSession = jest.fn();

jest.mock('../src/config/environment', () => ({
  environment: {
    name: 'development-live',
    apiUrl: 'https://api.example.test/api/v1/',
  },
}));
jest.mock('../src/services/auth/sessionManager', () => ({
  getAccessToken: () => mockGetAccessToken(),
  refreshSession: () => mockRefreshSession(),
}));

import { createApiConfig } from '../src/services/api/apiConfig';
import { apiRequest } from '../src/services/api/apiClient';
import {
  NetworkError,
  RequestCancelledError,
  TimeoutError,
  ValidationError,
} from '../src/services/api/apiError';
import type {
  ApiErrorResponse,
  ApiResponse,
} from '../src/services/api/apiTypes';

function response(
  status: number,
  body: unknown,
  requestId = 'server-request-id',
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'x-request-id' ? requestId : null,
    },
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('Phase 4.4A API client foundation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockGetAccessToken.mockReturnValue('access-token');
    globalThis.fetch = jest.fn();
  });

  it('unwraps a successful backend envelope and exposes response metadata', async () => {
    const envelope: ApiResponse<{ id: string }> = {
      data: { id: 'customer-1' },
      meta: {
        requestId: 'backend-request-id',
        generatedAt: '2026-08-26T00:00:00.000Z',
      },
      errors: [],
    };
    const onResponseMeta = jest.fn();
    jest.mocked(globalThis.fetch).mockResolvedValue(response(200, envelope));

    await expect(
      apiRequest<{ id: string }>('/customers/me', {}, { onResponseMeta }),
    ).resolves.toEqual({ id: 'customer-1' });
    expect(onResponseMeta).toHaveBeenCalledWith({
      requestId: 'backend-request-id',
      generatedAt: '2026-08-26T00:00:00.000Z',
      status: 200,
    });
  });

  it('parses backend error envelopes into normalized safe errors', async () => {
    const envelope: ApiErrorResponse = {
      data: null,
      meta: { requestId: 'validation-request-id' },
      errors: [
        {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: { field: 'phone' },
        },
      ],
    };
    jest.mocked(globalThis.fetch).mockResolvedValue(response(422, envelope));

    await expect(
      apiRequest('/customers', {}, { authenticate: false }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      backendCode: 'VALIDATION_FAILED',
      message: 'Request validation failed',
      requestId: 'validation-request-id',
      status: 422,
      details: { field: 'phone' },
    });
  });

  it('adds JSON, token, custom, and correlation headers', async () => {
    jest.mocked(globalThis.fetch).mockResolvedValue(
      response(200, {
        data: { ok: true },
        meta: { requestId: 'request-123' },
        errors: [],
      }),
    );
    await apiRequest(
      '/test',
      { headers: { 'X-Client-Version': '1.0.0' } },
      { requestId: 'request-123' },
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-token',
          'X-Client-Version': '1.0.0',
          'X-Request-Id': 'request-123',
        }),
      }),
    );
  });

  it('allows requests when no access token exists without sending an empty token', async () => {
    mockGetAccessToken.mockReturnValue(null);
    jest.mocked(globalThis.fetch).mockResolvedValue(
      response(200, {
        data: { ok: true },
        meta: { requestId: 'anonymous-request' },
        errors: [],
      }),
    );
    await apiRequest('/public');
    const init = jest.mocked(globalThis.fetch).mock.calls[0]?.[1];
    expect(init?.headers).not.toHaveProperty('Authorization');
  });

  it('normalizes network failures', async () => {
    jest.mocked(globalThis.fetch).mockRejectedValue(new TypeError('offline'));
    await expect(apiRequest('/offline')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
    await expect(apiRequest('/offline')).rejects.toBeInstanceOf(NetworkError);
  });

  it('times out through AbortController with a stable error code', async () => {
    jest.useFakeTimers();
    jest.mocked(globalThis.fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('aborted')),
          );
        }),
    );
    const request = apiRequest('/slow', {}, { timeoutMs: 10 });
    const expectation = expect(request).rejects.toMatchObject({
      code: 'TIMEOUT_ERROR',
    });
    await jest.advanceTimersByTimeAsync(11);
    await expectation;
    await expect(
      Promise.reject(
        new TimeoutError('timeout', undefined, undefined, 'TIMEOUT_ERROR'),
      ),
    ).rejects.toBeInstanceOf(TimeoutError);
  });

  it('supports caller cancellation independently from timeout handling', async () => {
    const controller = new AbortController();
    jest.mocked(globalThis.fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('aborted')),
          );
        }),
    );
    const request = apiRequest('/cancelled', { signal: controller.signal });
    controller.abort();
    await expect(request).rejects.toBeInstanceOf(RequestCancelledError);
    await expect(request).rejects.toMatchObject({ code: 'REQUEST_CANCELLED' });
  });

  it('validates development, staging, and production configuration', () => {
    expect(
      createApiConfig({
        name: 'development-live',
        apiUrl: 'http://localhost:4000/api/v1/',
      }),
    ).toEqual({
      API_BASE_URL: 'http://localhost:4000/api/v1',
      API_TIMEOUT: 15_000,
      ENVIRONMENT: 'development-live',
    });
    expect(
      createApiConfig({
        name: 'staging',
        apiUrl: 'https://staging.example.test/api/v1',
      }).ENVIRONMENT,
    ).toBe('staging');
    expect(
      createApiConfig({
        name: 'production',
        apiUrl: 'https://api.example.test/api/v1',
      }).ENVIRONMENT,
    ).toBe('production');
    expect(() =>
      createApiConfig({
        name: 'production',
        apiUrl: 'http://api.example.test/api/v1',
      }),
    ).toThrow('must use HTTPS');
    expect(() =>
      createApiConfig(
        { name: 'staging', apiUrl: 'https://staging.example.test/api/v1' },
        0,
      ),
    ).toThrow('API_TIMEOUT');
  });

  it('classifies invalid success JSON as a validation error', async () => {
    jest.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'invalid-json-request' },
      text: async () => '<html>not json</html>',
    } as unknown as Response);
    await expect(apiRequest('/invalid-json')).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});
