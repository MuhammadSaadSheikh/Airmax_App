require('reflect-metadata');

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} = require('@nestjs/common');
const { firstValueFrom, of } = require('rxjs');
const {
  ApiExceptionFilter,
  classifyException,
} = require('../dist/common/http/api-exception.filter.js');
const {
  createErrorEnvelope,
  createSuccessEnvelope,
} = require('../dist/common/http/api-envelope.js');
const {
  RequestContextService,
} = require('../dist/common/http/request-context.service.js');
const {
  RequestIdMiddleware,
} = require('../dist/common/http/request-id.middleware.js');
const {
  isValidRequestId,
  resolveRequestId,
} = require('../dist/common/http/request-id.js');
const {
  ResponseEnvelopeInterceptor,
} = require('../dist/common/http/response-envelope.interceptor.js');
const {
  createGlobalValidationPipe,
} = require('../dist/common/http/validation.js');
const {
  buildCursorPage,
  decodeCursor,
  encodeCursor,
  validatePageLimit,
} = require('../dist/common/pagination/cursor-pagination.js');
const {
  validateInfrastructureConfig,
} = require('../dist/config/infrastructure.config.js');
const { HealthService } = require('../dist/health/health.service.js');
const { LoginDto, RegisterDto } = require('../dist/auth/dto/auth.dto.js');

const validEnvironment = {
  DATABASE_URL: 'postgresql://airmax:secret@localhost:5432/airmax',
  REDIS_URL: 'redis://localhost:6379',
};

function responseDouble(statusCode = 200) {
  return {
    statusCode,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function executionContext(request, response) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  };
}

test('success and error envelopes include deterministic contract metadata', () => {
  const generatedAt = new Date('2026-08-24T12:00:00.000Z');
  assert.deepEqual(
    createSuccessEnvelope({ ok: true }, 'req_test', undefined, generatedAt),
    {
      data: { ok: true },
      meta: { requestId: 'req_test', generatedAt: generatedAt.toISOString() },
      errors: [],
    },
  );
  assert.deepEqual(
    createErrorEnvelope(
      [{ code: 'BAD_REQUEST', message: 'Invalid request' }],
      'req_test',
      generatedAt,
    ),
    {
      data: null,
      meta: { requestId: 'req_test', generatedAt: generatedAt.toISOString() },
      errors: [{ code: 'BAD_REQUEST', message: 'Invalid request' }],
    },
  );
});

test('response interceptor wraps JSON success and preserves 204 responses', async () => {
  const requestContext = new RequestContextService();
  const interceptor = new ResponseEnvelopeInterceptor(requestContext);
  const request = { requestId: 'req_interceptor' };
  const response = responseDouble();
  const wrapped = await firstValueFrom(
    interceptor.intercept(executionContext(request, response), {
      handle: () => of({ value: 42 }),
    }),
  );
  assert.deepEqual(wrapped.data, { value: 42 });
  assert.equal(wrapped.meta.requestId, 'req_interceptor');
  assert.match(wrapped.meta.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(wrapped.errors, []);

  const paginated = await firstValueFrom(
    interceptor.intercept(executionContext(request, response), {
      handle: () =>
        of({
          items: [{ id: '1' }],
          nextCursor: 'opaque',
          hasMore: true,
        }),
    }),
  );
  assert.deepEqual(paginated.data, [{ id: '1' }]);
  assert.deepEqual(paginated.meta.pagination, {
    nextCursor: 'opaque',
    hasMore: true,
  });

  response.statusCode = 204;
  const empty = await firstValueFrom(
    interceptor.intercept(executionContext(request, response), {
      handle: () => of(undefined),
    }),
  );
  assert.equal(empty, undefined);
});

test('request IDs preserve safe input and replace missing, invalid, or oversized input', () => {
  assert.equal(isValidRequestId('client.request-123:abc'), true);
  assert.equal(
    resolveRequestId('client.request-123:abc'),
    'client.request-123:abc',
  );
  for (const value of [
    undefined,
    'unsafe request id',
    'x'.repeat(129),
    ['array'],
  ]) {
    const generated = resolveRequestId(value);
    assert.match(generated, /^req_[0-9a-f-]{36}$/);
  }
});

test('request ID middleware exposes one correlated ID to response and downstream context', () => {
  const context = new RequestContextService();
  const middleware = new RequestIdMiddleware(context);
  const request = { headers: { 'x-request-id': 'req_incoming' } };
  const response = responseDouble();
  let downstreamId;
  middleware.use(request, response, () => {
    downstreamId = context.getRequestId();
  });
  assert.equal(request.requestId, 'req_incoming');
  assert.equal(response.headers['x-request-id'], 'req_incoming');
  assert.equal(downstreamId, 'req_incoming');
});

test('central error classification covers HTTP classes and sanitizes internal failures', () => {
  const cases = [
    [new BadRequestException('Bad input'), 400, 'BAD_REQUEST'],
    [new UnauthorizedException('Missing token'), 401, 'AUTHENTICATION_ERROR'],
    [new ForbiddenException('Denied'), 403, 'AUTHORIZATION_ERROR'],
    [new NotFoundException('Missing'), 404, 'NOT_FOUND'],
    [new ConflictException('Duplicate'), 409, 'CONFLICT'],
    [new HttpException('Slow down', 429), 429, 'RATE_LIMITED'],
  ];
  for (const [exception, status, code] of cases) {
    const classified = classifyException(exception);
    assert.equal(classified.status, status);
    assert.equal(classified.error.code, code);
  }

  const internal = classifyException(new Error('password=must-not-leak'));
  assert.equal(internal.status, 500);
  assert.equal(internal.error.code, 'INTERNAL_ERROR');
  assert.equal(JSON.stringify(internal).includes('must-not-leak'), false);
});

test('Prisma conflicts, missing records, and infrastructure errors are sanitized', () => {
  assert.deepEqual(classifyException({ code: 'P2002', message: 'raw index' }), {
    status: HttpStatus.CONFLICT,
    error: { code: 'CONFLICT', message: 'The resource already exists' },
  });
  assert.equal(classifyException({ code: 'P2025' }).error.code, 'NOT_FOUND');
  class PrismaClientInitializationError extends Error {}
  const database = classifyException(
    new PrismaClientInitializationError('postgresql://secret'),
  );
  assert.equal(database.status, 503);
  assert.equal(database.error.code, 'DATABASE_ERROR');
  assert.equal(JSON.stringify(database).includes('secret'), false);
});

test('exception filter returns the error envelope with the same request ID', () => {
  const context = new RequestContextService();
  const filter = new ApiExceptionFilter(context);
  const request = {
    requestId: 'req_error',
    method: 'GET',
    originalUrl: '/api/v1/missing',
  };
  const response = responseDouble();
  filter.catch(
    new NotFoundException('Resource not found'),
    executionContext(request, response),
  );
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.data, null);
  assert.equal(response.body.meta.requestId, 'req_error');
  assert.equal(response.body.errors[0].code, 'NOT_FOUND');
});

test('global validation accepts valid DTOs and rejects invalid or unknown fields consistently', async () => {
  const pipe = createGlobalValidationPipe();
  const valid = await pipe.transform(
    {
      identifier: 'user@example.com',
      password: 'password123',
    },
    { type: 'body', metatype: LoginDto },
  );
  assert.equal(valid.identifier, 'user@example.com');

  await assert.rejects(
    () =>
      pipe.transform(
        {
          identifier: 'x',
          password: 'short',
        },
        { type: 'body', metatype: LoginDto },
      ),
    error => error.code === 'VALIDATION_ERROR' && error.getStatus() === 400,
  );
  await assert.rejects(
    () =>
      pipe.transform(
        {
          name: 'Admin User',
          phone: '+923001234567',
          password: 'password123',
          role: 'ADMIN',
        },
        { type: 'body', metatype: RegisterDto },
      ),
    error => error.code === 'VALIDATION_ERROR',
  );
});

test('cursor pagination validates limits, round-trips opaque cursors, and reports hasMore', () => {
  assert.equal(validatePageLimit(undefined), 25);
  assert.equal(validatePageLimit('50'), 50);
  for (const value of [0, -1, 1.5, 101, 'nope']) {
    assert.throws(
      () => validatePageLimit(value),
      error => error.code === 'INVALID_PAGE_LIMIT',
    );
  }
  const cursor = encodeCursor('record-2');
  assert.equal(cursor.includes('record-2'), false);
  assert.deepEqual(decodeCursor(cursor), { v: 1, id: 'record-2' });
  assert.throws(
    () => decodeCursor('not-a-cursor'),
    error => error.code === 'INVALID_CURSOR',
  );

  const page = buildCursorPage(
    [{ id: '1' }, { id: '2' }, { id: '3' }],
    2,
    item => item.id,
  );
  assert.deepEqual(page.items, [{ id: '1' }, { id: '2' }]);
  assert.equal(page.hasMore, true);
  assert.equal(decodeCursor(page.nextCursor).id, '2');
  assert.deepEqual(
    buildCursorPage([], 2, item => item.id),
    {
      items: [],
      nextCursor: null,
      hasMore: false,
    },
  );
});

test('configuration normalizes valid values and fails closed for missing or invalid critical values', () => {
  const config = validateInfrastructureConfig(validEnvironment);
  assert.equal(config.API_PREFIX, 'api/v1');
  assert.equal(config.PORT, 4000);
  assert.equal(config.PAGINATION_DEFAULT_LIMIT, 25);
  assert.throws(() =>
    validateInfrastructureConfig({ REDIS_URL: 'redis://localhost' }),
  );
  assert.throws(() =>
    validateInfrastructureConfig({
      ...validEnvironment,
      NODE_ENV: 'prod',
    }),
  );
  assert.throws(() =>
    validateInfrastructureConfig({
      ...validEnvironment,
      API_PREFIX: 'api/v2',
    }),
  );
  assert.throws(() =>
    validateInfrastructureConfig({
      ...validEnvironment,
      PAGINATION_DEFAULT_LIMIT: 200,
      PAGINATION_MAX_LIMIT: 100,
    }),
  );
});

test('health service provides liveness and dependency-aware readiness', async () => {
  const healthy = new HealthService(
    { $queryRaw: async () => [1] },
    { ping: async () => 'PONG' },
  );
  assert.deepEqual(healthy.liveness(), { status: 'alive' });
  assert.deepEqual(await healthy.readiness(), {
    status: 'ready',
    dependencies: { database: 'up', redis: 'up' },
  });

  const unhealthy = new HealthService(
    {
      $queryRaw: async () => {
        throw new Error('database unavailable');
      },
    },
    { ping: async () => 'PONG' },
  );
  await assert.rejects(
    () => unhealthy.readiness(),
    error => error.code === 'READINESS_FAILED' && error.getStatus() === 503,
  );
});
