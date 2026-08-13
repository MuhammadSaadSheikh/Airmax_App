require('reflect-metadata');

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const { ValidationPipe } = require('@nestjs/common');
const { GUARDS_METADATA } = require('@nestjs/common/constants');
const { Reflector } = require('@nestjs/core');
const { ThrottlerGuard } = require('@nestjs/throttler');
const { Role, UserStatus } = require('@prisma/client');
const { hash } = require('bcryptjs');
const { AuthController } = require('../dist/auth/auth.controller.js');
const { AuthService } = require('../dist/auth/auth.service.js');
const {
  OtpVerifyDto,
  RegisterDto,
} = require('../dist/auth/dto/auth.dto.js');
const {
  AUTH_RATE_LIMITS,
} = require('../dist/common/security/auth-rate-limits.js');
const { ROLES_KEY } = require('../dist/common/decorators/roles.decorator.js');
const { JwtAuthGuard } = require('../dist/common/guards/jwt-auth.guard.js');
const { RolesGuard } = require('../dist/common/guards/roles.guard.js');
const {
  loadSecurityConfig,
} = require('../dist/config/security.config.js');
const { UsersController } = require('../dist/users/users.controller.js');
const { UsersService } = require('../dist/users/users.service.js');

const tokenHash = token => createHash('sha256').update(token).digest('hex');

const securityValues = {
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'r'.repeat(32),
  JWT_ISSUER: 'airmax-api',
  JWT_AUDIENCE: 'airmax-clients',
  OTP_PEPPER: 'o'.repeat(32),
};

function fakeConfig(overrides = {}) {
  const values = { ...securityValues, ...overrides };
  return {
    get: key => values[key],
    getOrThrow: key => {
      if (!values[key]) throw new Error(`Missing configuration: ${key}`);
      return values[key];
    },
  };
}

function createUser(overrides = {}) {
  const now = new Date('2026-08-11T00:00:00.000Z');
  return {
    id: 'user-1',
    name: 'Ahmed Khan',
    phone: '+923001234567',
    email: 'ahmed@example.com',
    passwordHash: 'not-set',
    role: Role.CUSTOMER,
    status: UserStatus.ACTIVE,
    address: 'Karachi',
    cnic: '42101-1234567-1',
    connectionId: 'AMX-1042',
    installationDate: now,
    routerDetails: { model: 'Test Router' },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeJwtService {
  constructor() {
    this.counter = 0;
    this.tokens = new Map();
  }

  async signAsync(payload, options) {
    const token = `${payload.tokenType}-token-${++this.counter}`;
    this.tokens.set(token, { payload: { ...payload }, options: { ...options } });
    return token;
  }

  async verifyAsync(token, options) {
    const stored = this.tokens.get(token);
    if (
      !stored ||
      stored.options.secret !== options.secret ||
      stored.options.issuer !== options.issuer ||
      stored.options.audience !== options.audience
    ) {
      throw new Error('Invalid token claims');
    }
    return { ...stored.payload };
  }
}

class FakePrismaService {
  constructor(users = []) {
    this.users = users;
    this.refreshTokens = [];
    this.nextTokenId = 1;
    this.user = {
      create: async ({ data }) => {
        const user = createUser({
          id: `user-${this.users.length + 1}`,
          ...data,
          status: data.status ?? UserStatus.PENDING,
        });
        this.users.push(user);
        return { ...user };
      },
      findFirst: async ({ where }) => {
        const identifiers = where.OR.map(item => item.phone ?? item.email);
        return this.users.find(user =>
          identifiers.includes(user.phone) ||
          (user.email && identifiers.includes(user.email)),
        ) ?? null;
      },
      findUnique: async ({ where }) =>
        this.users.find(user =>
          where.phone ? user.phone === where.phone : user.id === where.id,
        ) ?? null,
      findUniqueOrThrow: async ({ where }) => {
        const user = this.users.find(item => item.id === where.id);
        if (!user) throw new Error('User not found');
        return {
          ...user,
          subscriptions: user.subscriptions ?? [],
          refreshTokens: [{ tokenHash: 'must-not-leak' }],
        };
      },
      findMany: async () => this.users.map(user => ({ ...user })),
    };
    this.refreshToken = {
      create: async ({ data }) => {
        const record = {
          id: `refresh-${this.nextTokenId++}`,
          revokedAt: null,
          createdAt: new Date(),
          ...data,
        };
        this.refreshTokens.push(record);
        return { ...record };
      },
      findUnique: async ({ where }) => {
        const record = this.refreshTokens.find(
          item => item.tokenHash === where.tokenHash,
        );
        if (!record) return null;
        return {
          ...record,
          user: this.users.find(item => item.id === record.userId),
        };
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const record of this.refreshTokens) {
          const matches =
            (!where.id || record.id === where.id) &&
            (!where.userId || record.userId === where.userId) &&
            (!where.tokenHash || record.tokenHash === where.tokenHash) &&
            (where.revokedAt === undefined || record.revokedAt === where.revokedAt) &&
            (!where.expiresAt?.gt || record.expiresAt > where.expiresAt.gt);
          if (matches) {
            Object.assign(record, data);
            count += 1;
          }
        }
        return { count };
      },
    };
  }

  async $transaction(callback) {
    return callback({ refreshToken: this.refreshToken });
  }
}

class FakeRedisService {
  constructor() {
    this.values = new Map();
  }

  async set(key, value, ...args) {
    if (args.includes('NX') && this.values.has(key)) return null;
    this.values.set(key, value);
    return 'OK';
  }

  async get(key) {
    return this.values.get(key) ?? null;
  }

  async del(...keys) {
    return keys.reduce((count, key) => count + Number(this.values.delete(key)), 0);
  }

  async eval(_script, _numberOfKeys, key, now, phone, candidateHash, maxAttempts) {
    const value = this.values.get(key);
    if (!value) return -1;
    const challenge = JSON.parse(value);
    if (challenge.expiresAt <= Number(now)) {
      this.values.delete(key);
      return -1;
    }
    if (challenge.phone !== phone || challenge.codeHash !== candidateHash) {
      challenge.attempts += 1;
      if (challenge.attempts >= Number(maxAttempts)) {
        this.values.delete(key);
        return -2;
      }
      this.values.set(key, JSON.stringify(challenge));
      return 0;
    }
    this.values.delete(key);
    return 1;
  }
}

function createFixture(users = []) {
  const prisma = new FakePrismaService(users);
  const jwt = new FakeJwtService();
  const redis = new FakeRedisService();
  const delivery = {
    messages: [],
    async send(phone, code) {
      this.messages.push({ phone, code });
    },
  };
  return {
    prisma,
    jwt,
    redis,
    delivery,
    service: new AuthService(prisma, jwt, fakeConfig(), redis, delivery),
  };
}

async function issueOtp(fixture, user) {
  const challenge = await fixture.service.requestOtp(user.phone);
  const code = fixture.delivery.messages.at(-1).code;
  return { ...challenge, code };
}

test('authentication endpoints have active per-route throttling', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, AuthController);
  assert.ok(guards.includes(ThrottlerGuard));
  const routes = {
    register: AUTH_RATE_LIMITS.register,
    login: AUTH_RATE_LIMITS.login,
    otp: AUTH_RATE_LIMITS.otpRequest,
    verify: AUTH_RATE_LIMITS.otpVerify,
    refresh: AUTH_RATE_LIMITS.refresh,
    logout: AUTH_RATE_LIMITS.logout,
  };
  for (const [method, expected] of Object.entries(routes)) {
    assert.equal(
      Reflect.getMetadata('THROTTLER:LIMITauth', AuthController.prototype[method]),
      expected.limit,
    );
    assert.equal(
      Reflect.getMetadata('THROTTLER:TTLauth', AuthController.prototype[method]),
      expected.ttl,
    );
  }
});

test('DTOs reject public role, oversized fields, and malformed OTPs', async () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  await assert.rejects(() => pipe.transform({
    name: 'Public Admin',
    phone: '+923001234567',
    email: 'public@example.com',
    password: 'password123',
    role: Role.ADMIN,
  }, { type: 'body', metatype: RegisterDto }));
  await assert.rejects(() => pipe.transform({
    name: 'x'.repeat(101),
    phone: '+923001234567',
    password: 'password123',
  }, { type: 'body', metatype: RegisterDto }));
  await assert.rejects(() => pipe.transform({
    phone: '+923001234567',
    code: '12345a',
    challengeId: 'not-a-uuid',
  }, { type: 'body', metatype: OtpVerifyDto }));
});

test('registration creates a pending CUSTOMER without issuing tokens', async () => {
  const { prisma, service } = createFixture();
  const response = await service.register({
    name: 'Public User',
    phone: '+923001234567',
    email: 'public@example.com',
    password: 'password123',
    role: Role.ADMIN,
  });
  assert.equal(prisma.users[0].role, Role.CUSTOMER);
  assert.equal(prisma.users[0].status, UserStatus.PENDING);
  assert.equal(response.user.role, Role.CUSTOMER);
  assert.equal('passwordHash' in response.user, false);
  assert.equal('accessToken' in response, false);
});

test('only ACTIVE accounts can use password login', async () => {
  const passwordHash = await hash('password123', 4);
  for (const status of Object.values(UserStatus)) {
    const user = createUser({ status, passwordHash });
    const { service } = createFixture([user]);
    if (status === UserStatus.ACTIVE) {
      await assert.doesNotReject(() => service.login(user.email, 'password123'));
    } else {
      await assert.rejects(() => service.login(user.email, 'password123'));
    }
  }
  const user = createUser({ passwordHash });
  await assert.rejects(() =>
    createFixture([user]).service.login(user.email, 'wrong-password'),
  );
});

test('OTP challenges store only a keyed hash and enforce request cooldown', async () => {
  const user = createUser();
  const fixture = createFixture([user]);
  const issued = await issueOtp(fixture, user);
  const storedChallenge = [...fixture.redis.values.values()].find(value =>
    value.includes('codeHash'),
  );
  assert.ok(storedChallenge);
  assert.equal(storedChallenge.includes(issued.code), false);
  await assert.rejects(() => fixture.service.requestOtp(user.phone), error =>
    error.getStatus() === 429,
  );
});

test('OTP verification enforces maximum attempts and challenge binding', async () => {
  const user = createUser();
  const fixture = createFixture([user]);
  const issued = await issueOtp(fixture, user);
  await assert.rejects(() =>
    fixture.service.verifyOtp(user.phone, crypto.randomUUID(), issued.code),
  );
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(() =>
      fixture.service.verifyOtp(user.phone, issued.challengeId, '000000'),
    );
  }
  await assert.rejects(() =>
    fixture.service.verifyOtp(user.phone, issued.challengeId, issued.code),
  );
});

test('OTP is single-use and concurrent verification has one winner', async () => {
  const user = createUser();
  const fixture = createFixture([user]);
  const issued = await issueOtp(fixture, user);
  const results = await Promise.allSettled([
    fixture.service.verifyOtp(user.phone, issued.challengeId, issued.code),
    fixture.service.verifyOtp(user.phone, issued.challengeId, issued.code),
  ]);
  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(results.filter(item => item.status === 'rejected').length, 1);
  await assert.rejects(() =>
    fixture.service.verifyOtp(user.phone, issued.challengeId, issued.code),
  );
});

test('OTP verification enforces expiry and ACTIVE account status', async () => {
  const expiredUser = createUser();
  const expiredFixture = createFixture([expiredUser]);
  const expired = await issueOtp(expiredFixture, expiredUser);
  for (const [key, value] of expiredFixture.redis.values) {
    if (value.includes('codeHash')) {
      expiredFixture.redis.values.set(key, JSON.stringify({
        ...JSON.parse(value),
        expiresAt: 0,
      }));
    }
  }
  await assert.rejects(() => expiredFixture.service.verifyOtp(
    expiredUser.phone,
    expired.challengeId,
    expired.code,
  ));

  const pending = createUser({ status: UserStatus.PENDING });
  const pendingFixture = createFixture([pending]);
  const issued = await issueOtp(pendingFixture, pending);
  await assert.rejects(() => pendingFixture.service.verifyOtp(
    pending.phone,
    issued.challengeId,
    issued.code,
  ));
});

test('refresh rotation detects replay and revokes every active user token', async () => {
  const user = createUser({ passwordHash: await hash('password123', 4) });
  const fixture = createFixture([user]);
  const first = await fixture.service.login(user.email, 'password123');
  const second = await fixture.service.login(user.email, 'password123');
  const rotated = await fixture.service.refresh(first.refreshToken);
  await assert.rejects(() => fixture.service.refresh(first.refreshToken));
  assert.ok(fixture.prisma.refreshTokens.every(token => token.revokedAt));
  await assert.rejects(() => fixture.service.refresh(second.refreshToken));
  await assert.rejects(() => fixture.service.refresh(rotated.refreshToken));
});

test('concurrent refresh replay permits one response but contains its token', async () => {
  const user = createUser({ passwordHash: await hash('password123', 4) });
  const fixture = createFixture([user]);
  const initial = await fixture.service.login(user.email, 'password123');
  const results = await Promise.allSettled([
    fixture.service.refresh(initial.refreshToken),
    fixture.service.refresh(initial.refreshToken),
  ]);
  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(results.filter(item => item.status === 'rejected').length, 1);
  assert.ok(fixture.prisma.refreshTokens.every(token => token.revokedAt));
});

test('refresh rejects expired tokens and all non-ACTIVE account statuses', async () => {
  const passwordHash = await hash('password123', 4);
  const active = createUser({ passwordHash });
  const expiredFixture = createFixture([active]);
  const session = await expiredFixture.service.login(active.email, 'password123');
  expiredFixture.prisma.refreshTokens[0].expiresAt = new Date(0);
  await assert.rejects(() => expiredFixture.service.refresh(session.refreshToken));

  for (const status of [UserStatus.PENDING, UserStatus.SUSPENDED, UserStatus.DISABLED]) {
    const user = createUser({ status: UserStatus.ACTIVE, passwordHash });
    const fixture = createFixture([user]);
    const activeSession = await fixture.service.login(user.email, 'password123');
    user.status = status;
    await assert.rejects(() => fixture.service.refresh(activeSession.refreshToken));
  }
});

test('logout revokes a refresh token and remains idempotent', async () => {
  const user = createUser({ passwordHash: await hash('password123', 4) });
  const fixture = createFixture([user]);
  const session = await fixture.service.login(user.email, 'password123');
  await fixture.service.logout(session.refreshToken);
  await fixture.service.logout(session.refreshToken);
  assert.ok(fixture.prisma.refreshTokens[0].revokedAt);
});

test('JWT guard validates issuer, audience, and access token type', async () => {
  const jwt = new FakeJwtService();
  const config = fakeConfig();
  const claims = {
    sub: 'user-1',
    role: Role.CUSTOMER,
    phone: '+923001234567',
    tokenType: 'access',
    jti: 'access-jti',
  };
  const sign = (payload, issuer = securityValues.JWT_ISSUER, audience = securityValues.JWT_AUDIENCE) =>
    jwt.signAsync(payload, {
      secret: securityValues.JWT_ACCESS_SECRET,
      issuer,
      audience,
    });
  const valid = await sign(claims);
  const wrongIssuer = await sign(claims, 'attacker');
  const wrongAudience = await sign(claims, securityValues.JWT_ISSUER, 'other');
  const wrongType = await sign({ ...claims, tokenType: 'refresh' });
  const guard = new JwtAuthGuard(jwt, config);
  const contextFor = token => {
    const request = { headers: { authorization: `Bearer ${token}` } };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      request,
    };
  };
  assert.equal(await guard.canActivate(contextFor(valid)), true);
  await assert.rejects(() => guard.canActivate(contextFor(wrongIssuer)));
  await assert.rejects(() => guard.canActivate(contextFor(wrongAudience)));
  await assert.rejects(() => guard.canActivate(contextFor(wrongType)));
});

test('security configuration rejects missing, weak, and reused secrets', () => {
  assert.throws(() => loadSecurityConfig(fakeConfig({ JWT_ISSUER: '' })));
  assert.throws(() => loadSecurityConfig(fakeConfig({ OTP_PEPPER: 'short' })));
  assert.throws(() => loadSecurityConfig(fakeConfig({
    JWT_REFRESH_SECRET: securityValues.JWT_ACCESS_SECRET,
  })));
  assert.doesNotThrow(() => loadSecurityConfig(fakeConfig()));
});

test('user profiles are sanitized and detail authorization is ADMIN-only', async () => {
  const fullUser = createUser({
    subscriptions: [{ id: 'subscription-1', package: { id: 'package-1' } }],
  });
  const service = new UsersService(new FakePrismaService([fullUser]));
  const profile = await service.profile(fullUser.id);
  assert.equal('passwordHash' in profile, false);
  assert.equal('refreshTokens' in profile, false);

  assert.deepEqual(
    Reflect.getMetadata(ROLES_KEY, UsersController.prototype.detail),
    [Role.ADMIN],
  );
  const guard = new RolesGuard(new Reflector());
  const contextFor = role => ({
    getHandler: () => UsersController.prototype.detail,
    getClass: () => UsersController,
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  });
  assert.equal(guard.canActivate(contextFor(Role.CUSTOMER)), false);
  assert.equal(guard.canActivate(contextFor(Role.ADMIN)), true);
});
