const mockLogoutRequest = jest.fn();
const mockClearSession = jest.fn();
const mockCancelQueries = jest.fn();
const mockClearQueries = jest.fn();
const mockGetRefreshToken = jest.fn();

jest.mock('../src/services/api/auth.service', () => ({
  authService: {
    login: jest.fn(),
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
    refresh: jest.fn(),
    logout: (...args: unknown[]) => mockLogoutRequest(...args),
  },
}));
jest.mock('../src/services/auth/sessionManager', () => ({
  clearSession: () => mockClearSession(),
  establishSession: jest.fn(),
  restoreSession: jest.fn(),
}));
jest.mock('../src/services/auth/tokenStorage', () => ({
  getRefreshToken: () => mockGetRefreshToken(),
  removeLegacyAuthStorage: jest.fn(),
}));
jest.mock('../src/services/query', () => ({
  queryClient: {
    cancelQueries: () => mockCancelQueries(),
    clear: () => mockClearQueries(),
  },
}));

import { useAuthStore } from '../src/store/auth.store';

const user = {
  id: 'admin-1',
  name: 'Admin',
  phone: '+923001234567',
  role: 'admin' as const,
  status: 'active' as const,
};

describe('logout cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRefreshToken.mockResolvedValue('stored-refresh');
    mockLogoutRequest.mockResolvedValue(undefined);
    mockClearSession.mockResolvedValue(undefined);
    mockCancelQueries.mockResolvedValue(undefined);
    useAuthStore.setState({
      status: 'authenticated',
      user,
      error: null,
    });
  });

  it('clears all local auth state before best-effort server revocation', async () => {
    await useAuthStore.getState().logout();

    expect(mockLogoutRequest).toHaveBeenCalledWith('stored-refresh');
    expect(mockClearSession).toHaveBeenCalled();
    expect(mockCancelQueries).toHaveBeenCalled();
    expect(mockClearQueries).toHaveBeenCalled();
    expect(mockClearSession.mock.invocationCallOrder[0]).toBeLessThan(
      mockLogoutRequest.mock.invocationCallOrder[0]!,
    );
    expect(useAuthStore.getState()).toMatchObject({
      status: 'anonymous',
      user: null,
    });
  });

  it('still clears local state when server revocation fails', async () => {
    mockLogoutRequest.mockRejectedValue(new Error('Network unavailable'));

    await expect(useAuthStore.getState().logout()).resolves.toBeUndefined();
    expect(mockClearSession).toHaveBeenCalled();
    expect(mockClearQueries).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });
});
