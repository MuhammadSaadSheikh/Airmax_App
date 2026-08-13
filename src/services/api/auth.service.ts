import { environment } from '@/config/environment';
import type { AuthenticationService } from './auth.types';

function loadAuthenticationService(): AuthenticationService {
  if (environment.authMode === 'mock') {
    // Lazy loading prevents production from initializing mock auth state or OTPs.
    return require('./auth.mock.service').mockAuthService as AuthenticationService;
  }
  return require('./auth.live.service').liveAuthService as AuthenticationService;
}

export const authService = loadAuthenticationService();
