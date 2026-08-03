import { loginSchema } from '../src/features/auth/schema';

describe('login validation', () => {
  it('accepts valid customer credentials', () => {
    expect(loginSchema.safeParse({ identifier: '+92 300 1234567', password: 'airmax123', role: 'customer' }).success).toBe(true);
  });
  it('rejects short passwords', () => {
    expect(loginSchema.safeParse({ identifier: 'user@example.com', password: '123', role: 'customer' }).success).toBe(false);
  });
});
