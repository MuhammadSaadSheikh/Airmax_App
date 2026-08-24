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
}

const ENVIRONMENTS = new Set<RuntimeEnvironment>([
  'development',
  'test',
  'production',
]);
const LOG_LEVELS = new Set<LogLevel>(['error', 'warn', 'log', 'debug']);

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

export function validateInfrastructureConfig(
  input: Record<string, unknown>,
): InfrastructureEnvironment {
  const nodeEnv = String(input.NODE_ENV ?? 'development') as RuntimeEnvironment;
  if (!ENVIRONMENTS.has(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  const logLevel = String(input.LOG_LEVEL ?? 'log') as LogLevel;
  if (!LOG_LEVELS.has(logLevel)) {
    throw new Error('LOG_LEVEL is invalid');
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
    DATABASE_URL: requiredString(input, 'DATABASE_URL'),
    REDIS_URL: requiredString(input, 'REDIS_URL'),
  };
}
