import { create } from 'zustand';
import { authService } from '@/services/api/auth.service';
import type {
  LoginInput,
  OtpChallenge,
  SessionUser,
} from '@/services/api/auth.models';
import {
  clearSession,
  establishSession,
  restoreSession,
} from '@/services/auth/sessionManager';
import {
  getRefreshToken,
  removeLegacyAuthStorage,
} from '@/services/auth/tokenStorage';
import { queryClient } from '@/services/query';

export type AuthStatus =
  'bootstrapping' | 'anonymous' | 'authenticating' | 'authenticated';

type AuthState = {
  status: AuthStatus;
  user: SessionUser | null;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  requestOtp: (phone: string) => Promise<OtpChallenge>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  acceptSession: (user: SessionUser) => void;
  expireSession: () => void;
  clearError: () => void;
};

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Authentication failed. Please try again.';
}

async function clearQueries(): Promise<void> {
  await queryClient.cancelQueries().catch(() => undefined);
  queryClient.clear();
}

export const useAuthStore = create<AuthState>(set => ({
  status: 'bootstrapping',
  user: null,
  error: null,

  bootstrap: async () => {
    set({ status: 'bootstrapping', user: null, error: null });
    await removeLegacyAuthStorage().catch(() => undefined);
    try {
      const session = await restoreSession();
      set(
        session
          ? { status: 'authenticated', user: session.user, error: null }
          : { status: 'anonymous', user: null, error: null },
      );
    } catch {
      set({ status: 'anonymous', user: null, error: null });
    }
  },

  login: async input => {
    set({ status: 'authenticating', user: null, error: null });
    try {
      const session = await authService.login(input);
      await establishSession(session);
      set({ status: 'authenticated', user: session.user, error: null });
    } catch (error) {
      await clearSession().catch(() => undefined);
      set({ status: 'anonymous', user: null, error: messageFrom(error) });
      throw error;
    }
  },

  requestOtp: phone => authService.requestOtp(phone),

  verifyOtp: async (phone, code) => {
    set({ status: 'authenticating', user: null, error: null });
    try {
      const session = await authService.verifyOtp(phone, code);
      await establishSession(session);
      set({ status: 'authenticated', user: session.user, error: null });
    } catch (error) {
      await clearSession().catch(() => undefined);
      set({ status: 'anonymous', user: null, error: messageFrom(error) });
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = await getRefreshToken().catch(() => null);
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => undefined);
    }
    await clearSession().catch(() => undefined);
    await clearQueries();
    set({ status: 'anonymous', user: null, error: null });
  },

  acceptSession: user => set({ status: 'authenticated', user, error: null }),
  expireSession: () => set({ status: 'anonymous', user: null, error: null }),
  clearError: () => set({ error: null }),
}));

export async function clearAuthAfterSessionExpiry(): Promise<void> {
  await clearQueries();
  useAuthStore.getState().expireSession();
}
