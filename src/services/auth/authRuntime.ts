import { authService } from '@/services/api/auth.service';
import { useAuthStore, clearAuthAfterSessionExpiry } from '@/store/auth.store';
import { configureSessionManager } from './sessionManager';

let configured = false;

export function initializeAuthRuntime(): void {
  if (configured) return;
  configureSessionManager({
    refresh: refreshToken => authService.refresh(refreshToken),
    onSession: session => useAuthStore.getState().acceptSession(session.user),
    onExpired: clearAuthAfterSessionExpiry,
  });
  configured = true;
}
