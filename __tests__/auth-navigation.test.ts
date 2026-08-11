import { resolveAuthRoot } from '../src/navigation/authRoot';
import type { SessionUser } from '../src/services/api/auth.models';

const user = (role: 'admin' | 'customer'): SessionUser => ({
  id: `${role}-1`,
  name: role,
  phone: '+923001234567',
  role,
  status: 'active',
});

describe('state-driven auth navigation', () => {
  it('opens the admin portal only for an authenticated admin', () => {
    expect(resolveAuthRoot('authenticated', user('admin'))).toBe('Admin');
  });

  it('opens the customer portal for an authenticated customer', () => {
    expect(resolveAuthRoot('authenticated', user('customer'))).toBe('Customer');
  });

  it('opens auth for anonymous state and splash while bootstrapping', () => {
    expect(resolveAuthRoot('anonymous', null)).toBe('Auth');
    expect(resolveAuthRoot('bootstrapping', null)).toBe('Splash');
  });
});
