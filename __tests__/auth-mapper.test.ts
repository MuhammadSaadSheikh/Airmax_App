import {
  AuthContractError,
  mapAuthSession,
  mapBackendRole,
} from '../src/services/api/auth.mapper';
import type { BackendAuthSession } from '../src/services/api/auth.models';

const response = (role: 'ADMIN' | 'CUSTOMER'): BackendAuthSession => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 'user-1',
    name: 'AIRMAX User',
    phone: '+923001234567',
    email: null,
    role,
    status: 'ACTIVE',
    address: null,
    connectionId: null,
  },
});

describe('auth response mapping', () => {
  it.each([
    ['ADMIN', 'admin'],
    ['CUSTOMER', 'customer'],
  ] as const)('maps backend role %s to %s', (backend, mobile) => {
    expect(mapBackendRole(backend)).toBe(mobile);
    expect(mapAuthSession(response(backend)).user.role).toBe(mobile);
  });

  it('rejects unknown roles instead of choosing a portal', () => {
    expect(() => mapBackendRole('TECHNICIAN')).toThrow(AuthContractError);
  });

  it('preserves pending account state returned by the backend', () => {
    const pending = response('CUSTOMER');
    pending.user.status = 'PENDING';
    expect(mapAuthSession(pending).user.status).toBe('pending');
  });
});
