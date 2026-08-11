import type { SessionUser } from '@/services/api/auth.models';
import type { AuthStatus } from '@/store/auth.store';

export type AuthRoot = 'Splash' | 'Auth' | 'Customer' | 'Admin';

export function resolveAuthRoot(
  status: AuthStatus,
  user: SessionUser | null,
): AuthRoot {
  if (status === 'bootstrapping') return 'Splash';
  if (status !== 'authenticated' || !user) return 'Auth';
  return user.role === 'admin' ? 'Admin' : 'Customer';
}
