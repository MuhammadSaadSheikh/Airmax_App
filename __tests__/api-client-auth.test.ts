const mockGetAccessToken = jest.fn();
const mockRefreshSession = jest.fn();

jest.mock('../src/config/environment', () => ({
  environment: { apiUrl: 'https://api.example.test', useMockApi: false },
}));
jest.mock('../src/services/auth/sessionManager', () => ({
  getAccessToken: () => mockGetAccessToken(),
  refreshSession: () => mockRefreshSession(),
}));

import { ApiError, apiRequest } from '../src/services/api/client';

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('authenticated API requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken.mockReturnValue('old-access');
    mockRefreshSession.mockImplementation(async () => {
      mockGetAccessToken.mockReturnValue('new-access');
    });
    globalThis.fetch = jest.fn();
  });

  it('refreshes on 401 and retries the request with the rotated access token', async () => {
    jest
      .mocked(globalThis.fetch)
      .mockResolvedValueOnce(response(401, { message: 'Expired' }))
      .mockResolvedValueOnce(response(200, { id: 'user-1' }));

    await expect(apiRequest('/users/me')).resolves.toEqual({ id: 'user-1' });
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/users/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer new-access',
        }),
      }),
    );
  });

  it('retries at most once and never starts a refresh loop', async () => {
    jest
      .mocked(globalThis.fetch)
      .mockResolvedValueOnce(response(401, { message: 'Expired' }))
      .mockResolvedValueOnce(response(401, { message: 'Still unauthorized' }));

    await expect(apiRequest('/users/me')).rejects.toMatchObject({
      status: 401,
    });
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('bypasses tokens and refresh for authentication endpoints', async () => {
    jest
      .mocked(globalThis.fetch)
      .mockResolvedValue(response(401, { message: 'Invalid credentials' }));

    await expect(
      apiRequest(
        '/auth/login',
        { method: 'POST' },
        { authenticate: false, refreshOnUnauthorized: false },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.test/auth/login',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      }),
    );
  });
});
