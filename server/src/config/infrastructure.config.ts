export type RuntimeEnvironment = 'development' | 'test' | 'production';
export type LogLevel = 'error' | 'warn' | 'log' | 'debug';

export interface InfrastructureEnvironment extends Record<string, unknown> {
  NODE_ENV: RuntimeEnvironment;
  PORT: number;
  API_PREFIX: string;
  REQUEST_BODY_LIMIT_BYTES: number;
  PAGINATION_DEFAULT_LIMIT: number;
  PAGINATION_MAX_LIMIT: number;
  LOG_LEVEL: LogLevel;
  DATABASE_URL: string;
  REDIS_URL: string;
  ADMIN_ORIGIN?: string;
  MIKROTIK_BASE_URL?: string;
  MIKROTIK_USERNAME?: string;
  MIKROTIK_PASSWORD?: string;
}

const ENVIRONMENTS = new Set<RuntimeEnvironment>([
  'development',
  'test',
  'production',
]);
const LOG_LEVELS = new Set<LogLevel>(['error', 'warn', 'log', 'debug']);
const PRODUCTION_SECRET_KEYS = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ISSUER',
  'JWT_AUDIENCE',
  'OTP_PEPPER',
] as const;
const MINIMUM_PRODUCTION_SECRET_LENGTH = 32;

function requiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} must be configured`);
  }
  return value.trim();
}

function integer(
  input: Record<string, unknown>,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = input[key] ?? fallback;
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${key} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return value;
}

function optionalString(
  input: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = input[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseUrl(
  value: string,
  key: string,
  protocols: readonly string[],
): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid absolute URL`);
  }
  if (!protocols.includes(url.protocol)) {
    throw new Error(`${key} must use ${protocols.join(' or ')}`);
  }
  return url;
}

function isUnsafeProductionHostname(hostname: string): boolean {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  const ipv4 = normalized.split('.').map(Number);
  const privateIpv4 =
    ipv4.length === 4 &&
    ipv4.every(part => Number.isInteger(part) && part >= 0 && part <= 255) &&
    (ipv4[0] === 10 ||
      (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31) ||
      (ipv4[0] === 192 && ipv4[1] === 168) ||
      (ipv4[0] === 169 && ipv4[1] === 254));
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    (normalized.includes(':') &&
      (normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe80:'))) ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized) ||
    privateIpv4 ||
    normalized === 'host.docker.internal'
  );
}

function assertProductionRemote(url: URL, key: string): void {
  if (isUnsafeProductionHostname(url.hostname)) {
    throw new Error(
      `${key} cannot target a local or private development host in production`,
    );
  }
}

function validateDatabaseUrl(value: string, production: boolean): string {
  const url = parseUrl(value, 'DATABASE_URL', ['postgresql:', 'postgres:']);
  if (production) {
    assertProductionRemote(url, 'DATABASE_URL');
    if (url.password === 'airmax_local') {
      throw new Error(
        'DATABASE_URL cannot use development credentials in production',
      );
    }
    const sslMode = url.searchParams.get('sslmode');
    if (!['require', 'verify-ca', 'verify-full'].includes(sslMode ?? '')) {
      throw new Error(
        'DATABASE_URL must require verified TLS in production with sslmode=require, verify-ca, or verify-full',
      );
    }
  }
  return value;
}

function validateRedisUrl(value: string, production: boolean): string {
  const url = parseUrl(value, 'REDIS_URL', ['redis:', 'rediss:']);
  if (production) {
    assertProductionRemote(url, 'REDIS_URL');
    if (url.protocol !== 'rediss:') {
      throw new Error('REDIS_URL must use rediss:// in production');
    }
  }
  return value;
}

function validateAdminOrigins(
  input: Record<string, unknown>,
  production: boolean,
): string | undefined {
  const configured = optionalString(input, 'ADMIN_ORIGIN');
  if (!configured) {
    if (production)
      throw new Error('ADMIN_ORIGIN must be configured in production');
    return undefined;
  }

  const origins = configured
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (!origins.length) throw new Error('ADMIN_ORIGIN must include an origin');
  for (const origin of origins) {
    const url = parseUrl(origin, 'ADMIN_ORIGIN', ['http:', 'https:']);
    if (
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        'ADMIN_ORIGIN entries must be origins without credentials, paths, queries, or fragments',
      );
    }
    if (production) {
      assertProductionRemote(url, 'ADMIN_ORIGIN');
      if (url.protocol !== 'https:') {
        throw new Error('ADMIN_ORIGIN must use https:// in production');
      }
    }
  }
  return origins.join(',');
}

function validateProductionSecurity(input: Record<string, unknown>): void {
  for (const key of PRODUCTION_SECRET_KEYS) requiredString(input, key);
  const accessSecret = requiredString(input, 'JWT_ACCESS_SECRET');
  const refreshSecret = requiredString(input, 'JWT_REFRESH_SECRET');
  const otpPepper = requiredString(input, 'OTP_PEPPER');
  for (const [key, value] of [
    ['JWT_ACCESS_SECRET', accessSecret],
    ['JWT_REFRESH_SECRET', refreshSecret],
    ['OTP_PEPPER', otpPepper],
  ] as const) {
    if (value.length < MINIMUM_PRODUCTION_SECRET_LENGTH) {
      throw new Error(
        `${key} must be at least ${MINIMUM_PRODUCTION_SECRET_LENGTH} characters`,
      );
    }
    if (/^replace-with-/i.test(value)) {
      throw new Error(`${key} cannot use an example placeholder in production`);
    }
  }
  if (accessSecret === refreshSecret) {
    throw new Error('JWT access and refresh secrets must be different');
  }
}

function validateMikroTikConfiguration(
  input: Record<string, unknown>,
  production: boolean,
): Pick<
  InfrastructureEnvironment,
  'MIKROTIK_BASE_URL' | 'MIKROTIK_USERNAME' | 'MIKROTIK_PASSWORD'
> {
  const baseUrl = optionalString(input, 'MIKROTIK_BASE_URL');
  const username = optionalString(input, 'MIKROTIK_USERNAME');
  const password = optionalString(input, 'MIKROTIK_PASSWORD');
  const configuredCount = [baseUrl, username, password].filter(Boolean).length;
  if (configuredCount > 0 && configuredCount < 3) {
    throw new Error(
      'MIKROTIK_BASE_URL, MIKROTIK_USERNAME, and MIKROTIK_PASSWORD must be configured together',
    );
  }
  if (baseUrl) {
    const url = parseUrl(baseUrl, 'MIKROTIK_BASE_URL', ['http:', 'https:']);
    if (production) {
      assertProductionRemote(url, 'MIKROTIK_BASE_URL');
      if (url.protocol !== 'https:') {
        throw new Error('MIKROTIK_BASE_URL must use https:// in production');
      }
    }
  }
  return {
    MIKROTIK_BASE_URL: baseUrl,
    MIKROTIK_USERNAME: username,
    MIKROTIK_PASSWORD: password,
  };
}

export function validateInfrastructureConfig(
  input: Record<string, unknown>,
): InfrastructureEnvironment {
  const nodeEnv = requiredString(input, 'NODE_ENV') as RuntimeEnvironment;
  if (!ENVIRONMENTS.has(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  const production = nodeEnv === 'production';
  const logLevel = String(input.LOG_LEVEL ?? 'log') as LogLevel;
  if (!LOG_LEVELS.has(logLevel)) {
    throw new Error('LOG_LEVEL is invalid');
  }
  if (production && logLevel === 'debug') {
    throw new Error('LOG_LEVEL cannot be debug in production');
  }
  const apiPrefix = String(input.API_PREFIX ?? 'api/v1').trim();
  if (apiPrefix !== 'api/v1') {
    throw new Error('API_PREFIX must remain api/v1');
  }

  const paginationMaximum = integer(input, 'PAGINATION_MAX_LIMIT', 100, 1, 500);
  const paginationDefault = integer(
    input,
    'PAGINATION_DEFAULT_LIMIT',
    25,
    1,
    paginationMaximum,
  );

  const databaseUrl = validateDatabaseUrl(
    requiredString(input, 'DATABASE_URL'),
    production,
  );
  const redisUrl = validateRedisUrl(
    requiredString(input, 'REDIS_URL'),
    production,
  );
  const adminOrigin = validateAdminOrigins(input, production);
  if (production) validateProductionSecurity(input);

  return {
    ...input,
    NODE_ENV: nodeEnv,
    PORT: integer(input, 'PORT', 4000, 1, 65_535),
    API_PREFIX: apiPrefix,
    REQUEST_BODY_LIMIT_BYTES: integer(
      input,
      'REQUEST_BODY_LIMIT_BYTES',
      1_048_576,
      1_024,
      10_485_760,
    ),
    PAGINATION_DEFAULT_LIMIT: paginationDefault,
    PAGINATION_MAX_LIMIT: paginationMaximum,
    LOG_LEVEL: logLevel,
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    ADMIN_ORIGIN: adminOrigin,
    ...validateMikroTikConfiguration(input, production),
  };
}
