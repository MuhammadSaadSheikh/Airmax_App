export const AUTH_THROTTLER_NAME = 'auth';

export const AUTH_RATE_LIMITS = {
  register: { limit: 3, ttl: 60_000 },
  login: { limit: 5, ttl: 60_000 },
  otpRequest: { limit: 3, ttl: 300_000 },
  otpVerify: { limit: 5, ttl: 300_000 },
  refresh: { limit: 10, ttl: 60_000 },
  logout: { limit: 10, ttl: 60_000 },
} as const;
