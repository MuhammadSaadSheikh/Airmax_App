import type { AuthSession } from '@/services/api/auth.models';
import {
  getRefreshToken,
  removeRefreshToken,
  setRefreshToken,
} from './tokenStorage';

type SessionManagerHandlers = {
  refresh: (refreshToken: string) => Promise<AuthSession>;
  onSession?: (session: AuthSession) => void | Promise<void>;
  onExpired?: () => void | Promise<void>;
};

export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.');
    this.name = 'SessionExpiredError';
  }
}

let accessToken: string | null = null;
let refreshInFlight: Promise<AuthSession> | null = null;
let handlers: SessionManagerHandlers | null = null;
let sessionGeneration = 0;

class SessionSupersededError extends Error {}

export function configureSessionManager(next: SessionManagerHandlers): void {
  handlers = next;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function establishSession(session: AuthSession): Promise<void> {
  const generation = ++sessionGeneration;
  await setRefreshToken(session.refreshToken);
  if (generation !== sessionGeneration) {
    await removeRefreshToken().catch(() => undefined);
    throw new SessionSupersededError();
  }
  accessToken = session.accessToken;
}

export async function clearSession(): Promise<void> {
  sessionGeneration += 1;
  accessToken = null;
  await removeRefreshToken();
}

export async function refreshSession(): Promise<AuthSession> {
  if (refreshInFlight) return refreshInFlight;
  if (!handlers) throw new Error('Session manager has not been configured');

  const activeHandlers = handlers;
  const refreshGeneration = sessionGeneration;
  refreshInFlight = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new SessionExpiredError();
      const session = await activeHandlers.refresh(refreshToken);
      if (refreshGeneration !== sessionGeneration) {
        throw new SessionSupersededError();
      }
      await setRefreshToken(session.refreshToken);
      if (refreshGeneration !== sessionGeneration) {
        await removeRefreshToken().catch(() => undefined);
        throw new SessionSupersededError();
      }
      accessToken = session.accessToken;
      await activeHandlers.onSession?.(session);
      return session;
    } catch (error) {
      if (error instanceof SessionSupersededError) {
        throw new SessionExpiredError();
      }
      accessToken = null;
      await removeRefreshToken().catch(() => undefined);
      await activeHandlers.onExpired?.();
      throw error instanceof SessionExpiredError
        ? error
        : new SessionExpiredError();
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function restoreSession(): Promise<AuthSession | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  return refreshSession();
}
