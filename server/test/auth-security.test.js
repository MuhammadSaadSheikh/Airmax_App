require('reflect-metadata');

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const { ValidationPipe } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const { Role, UserStatus } = require('@prisma/client');
const { hash } = require('bcryptjs');
const { AuthService } = require('../dist/auth/auth.service.js');
const { RegisterDto } = require('../dist/auth/dto/auth.dto.js');
const { ROLES_KEY } = require('../dist/common/decorators/roles.decorator.js');
const { JwtAuthGuard } = require('../dist/common/guards/jwt-auth.guard.js');
const { RolesGuard } = require('../dist/common/guards/roles.guard.js');
const { UsersController } = require('../dist/users/users.controller.js');
const { UsersService } = require('../dist/users/users.service.js');

const tokenHash = token =>
  createHash('sha256').update(token).digest('hex');

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
    this.counter += 1;
    const token = `${payload.tokenType}-token-${this.counter}`;
    this.tokens.set(token, { payload: { ...payload }, secret: options.secret });
    return token;
  }

  async verifyAsync(token, options) {
    const stored = this.tokens.get(token);
    if (!stored || stored.secret !== options.secret) {
      throw new Error('Invalid token');
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
        return (
          this.users.find(
            user =>
              identifiers.includes(user.phone) ||
              (user.email && identifiers.includes(user.email)),
          ) ?? null
        );
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
        const user = this.users.find(item => item.id === record.userId);
        return { ...record, user };
      },
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const record of this.refreshTokens) {
          const matches =
            (!where.id || record.id === where.id) &&
            (!where.userId || record.userId === where.userId) &&
            (!where.tokenHash || record.tokenHash === where.tokenHash) &&
            (where.revokedAt === undefined ||
              record.revokedAt === where.revokedAt) &&
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

function createFixture(users = []) {
  const prisma = new FakePrismaService(users);
  const jwt = new FakeJwtService();
  const config = {
    getOrThrow(key) {
      if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      throw new Error(`Missing configuration: ${key}`);
    },
  };
  const otp = new Map();
  const redis = {
    set: async (key, value) => otp.set(key, value),
    get: async key => otp.get(key) ?? null,
    del: async key => otp.delete(key),
  };
  return {
    prisma,
    jwt,
    redis,
    service: new AuthService(prisma, jwt, config, redis),
  };
}

test('registration DTO rejects a public role field', async () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  await assert.rejects(() =>
    pipe.transform(
      {
        name: 'Public Admin',
        phone: '+923001234567',
        email: 'public@example.com',
        password: 'password123',
        role: Role.ADMIN,
      },
      { type: 'body', metatype: RegisterDto },
    ),
  );
});

test('registration always creates CUSTOMER and returns no password hash', async () => {
  const { prisma, service } = createFixture();
  const response = await service.register({
    name: 'Public User',
    phone: '+923001234567',
    email: 'public@example.com',
    password: 'password123',
    role: Role.ADMIN,
  });

  assert.equal(prisma.users[0].role, Role.CUSTOMER);
  assert.equal(response.user.role, Role.CUSTOMER);
  assert.equal('passwordHash' in response.user, false);
  assert.equal('refreshTokens' in response.user, false);
});

test('login accepts valid and suspended users but rejects invalid credentials and disabled users', async () => {
  const passwordHash = await hash('password123', 4);
  const active = createUser({ passwordHash });
  const suspended = createUser({
    id: 'user-2',
    phone: '+923001234568',
    email: 'suspended@example.com',
    passwordHash,
    status: UserStatus.SUSPENDED,
  });
  const disabled = createUser({
    id: 'user-3',
    phone: '+923001234569',
    email: 'disabled@example.com',
    passwordHash,
    status: UserStatus.DISABLED,
  });
  const { service } = createFixture([active, suspended, disabled]);

  await assert.doesNotReject(() =>
    service.login(active.email, 'password123'),
  );
  await assert.doesNotReject(() =>
    service.login(suspended.email, 'password123'),
  );
  await assert.rejects(() => service.login(active.email, 'wrong-password'));
  await assert.rejects(() =>
    service.login(disabled.email, 'password123'),
  );
});

test('OTP authentication rejects disabled users', async () => {
  const disabled = createUser({ status: UserStatus.DISABLED });
  const { redis, service } = createFixture([disabled]);
  await redis.set(`otp:${disabled.phone}`, '123456');
  await assert.rejects(() => service.verifyOtp(disabled.phone, '123456'));
});

test('refresh rotates the token atomically and rejects replay', async () => {
  const passwordHash = await hash('password123', 4);
  const user = createUser({ passwordHash });
  const { prisma, service } = createFixture([user]);
  const initial = await service.login(user.email, 'password123');
  const rotated = await service.refresh(initial.refreshToken);

  assert.notEqual(rotated.accessToken, initial.accessToken);
  assert.notEqual(rotated.refreshToken, initial.refreshToken);
  assert.ok(
    prisma.refreshTokens.find(
      item => item.tokenHash === tokenHash(initial.refreshToken),
    ).revokedAt,
  );
  assert.ok(
    prisma.refreshTokens.find(
      item => item.tokenHash === tokenHash(rotated.refreshToken),
    ),
  );
  await assert.rejects(() => service.refresh(initial.refreshToken));
});

test('concurrent refresh reuse permits one successful rotation', async () => {
  const passwordHash = await hash('password123', 4);
  const user = createUser({ passwordHash });
  const { service } = createFixture([user]);
  const initial = await service.login(user.email, 'password123');
  const results = await Promise.allSettled([
    service.refresh(initial.refreshToken),
    service.refresh(initial.refreshToken),
  ]);

  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(results.filter(item => item.status === 'rejected').length, 1);
});

test('refresh rejects expired, revoked and disabled-user tokens', async () => {
  const passwordHash = await hash('password123', 4);

  const expiredUser = createUser({ passwordHash });
  const expiredFixture = createFixture([expiredUser]);
  const expiredSession = await expiredFixture.service.login(
    expiredUser.email,
    'password123',
  );
  expiredFixture.prisma.refreshTokens[0].expiresAt = new Date(0);
  await assert.rejects(() =>
    expiredFixture.service.refresh(expiredSession.refreshToken),
  );

  const revokedUser = createUser({ passwordHash });
  const revokedFixture = createFixture([revokedUser]);
  const revokedSession = await revokedFixture.service.login(
    revokedUser.email,
    'password123',
  );
  revokedFixture.prisma.refreshTokens[0].revokedAt = new Date();
  await assert.rejects(() =>
    revokedFixture.service.refresh(revokedSession.refreshToken),
  );

  const disabledUser = createUser({ passwordHash });
  const disabledFixture = createFixture([disabledUser]);
  const disabledSession = await disabledFixture.service.login(
    disabledUser.email,
    'password123',
  );
  disabledUser.status = UserStatus.DISABLED;
  await assert.rejects(() =>
    disabledFixture.service.refresh(disabledSession.refreshToken),
  );
});

test('logout revokes a token and is idempotent', async () => {
  const passwordHash = await hash('password123', 4);
  const user = createUser({ passwordHash });
  const { prisma, service } = createFixture([user]);
  const session = await service.login(user.email, 'password123');

  await service.logout(session.refreshToken);
  await service.logout(session.refreshToken);
  assert.ok(prisma.refreshTokens[0].revokedAt);
  await assert.rejects(() => service.refresh(session.refreshToken));
});

test('JWT guard accepts access tokens and rejects refresh tokens', async () => {
  const jwt = new FakeJwtService();
  const config = {
    getOrThrow: () => 'access-secret',
  };
  const accessToken = await jwt.signAsync(
    {
      sub: 'user-1',
      role: Role.CUSTOMER,
      phone: '+923001234567',
      tokenType: 'access',
      jti: 'access-jti',
    },
    { secret: 'access-secret' },
  );
  const refreshToken = await jwt.signAsync(
    {
      sub: 'user-1',
      role: Role.CUSTOMER,
      phone: '+923001234567',
      tokenType: 'refresh',
      jti: 'refresh-jti',
    },
    { secret: 'access-secret' },
  );
  const guard = new JwtAuthGuard(jwt, config);
  const contextFor = token => {
    const request = { headers: { authorization: `Bearer ${token}` } };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      request,
    };
  };

  const accessContext = contextFor(accessToken);
  assert.equal(await guard.canActivate(accessContext), true);
  assert.equal(accessContext.request.user.tokenType, 'access');
  await assert.rejects(() => guard.canActivate(contextFor(refreshToken)));
});

test('user profiles are sanitized and detail authorization is ADMIN-only', async () => {
  const fullUser = createUser({
    subscriptions: [{ id: 'subscription-1', package: { id: 'package-1' } }],
  });
  const prisma = new FakePrismaService([fullUser]);
  const service = new UsersService(prisma);
  const profile = await service.profile(fullUser.id);

  assert.equal('passwordHash' in profile, false);
  assert.equal('refreshTokens' in profile, false);
  assert.equal(profile.cnic, fullUser.cnic);
  assert.equal(profile.subscriptions.length, 1);

  const roles = Reflect.getMetadata(
    ROLES_KEY,
    UsersController.prototype.detail,
  );
  assert.deepEqual(roles, [Role.ADMIN]);

  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);
  const contextFor = role => ({
    getHandler: () => UsersController.prototype.detail,
    getClass: () => UsersController,
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  });
  assert.equal(guard.canActivate(contextFor(Role.CUSTOMER)), false);
  assert.equal(guard.canActivate(contextFor(Role.ADMIN)), true);

  const controller = new UsersController(service);
  await assert.doesNotReject(() =>
    controller.me({
      sub: fullUser.id,
      role: Role.CUSTOMER,
      phone: fullUser.phone,
      tokenType: 'access',
      jti: 'access-jti',
    }),
  );
});
